const { BigNumber, utils: {keccak256, defaultAbiCoder, toUtf8Bytes, solidityPack} } = require('ethers')

const expandTo18Decimals = (n) => {
    return BigNumber.from(n).mul(BigNumber.from(10).pow(18))
}
const MINIMUM_LIQUIDITY = BigNumber.from(10).pow(3)
const PERMIT_TYPEHASH = keccak256(
    toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
  )

const getApprovalDigest = async (
    token,
    approve,
    nonce,
    deadline
  ) => {
    const name = await token.name()
    const DOMAIN_SEPARATOR = getDomainSeparator(name, token.address)
    return keccak256(
      solidityPack(
        ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
        [
          '0x19',
          '0x01',
          DOMAIN_SEPARATOR,
          keccak256(
            defaultAbiCoder.encode(
              ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
              [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline]
            )
          )
        ]
      )
    )
  }
const getDomainSeparator = (name, tokenAddress) => {
    return keccak256(
      defaultAbiCoder.encode(
        ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
        [
          keccak256(toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')),
          keccak256(toUtf8Bytes(name)),
          keccak256(toUtf8Bytes('1')),
          31337,    //Local chainId
          //1,
          tokenAddress
        ]
      )
    )
  }

exports.expandTo18Decimals = expandTo18Decimals;
exports.MINIMUM_LIQUIDITY = MINIMUM_LIQUIDITY;
exports.getApprovalDigest = getApprovalDigest;
exports.getDomainSeparator = getDomainSeparator;