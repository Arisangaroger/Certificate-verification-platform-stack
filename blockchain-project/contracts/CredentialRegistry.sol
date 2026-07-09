// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


contract CredentialRegistry is Ownable, Pausable, ReentrancyGuard {



    struct RecordMetadata {
        string  issuerDid;   // W3C did:key string, e.g. "did:key:z6Mkp..."
        uint32  blockTime;   // Unix timestamp when the record was written
        bool    isRevoked;   // Emergency revocation flag
    }

  
    /// @dev Primary registry: keccak256 data hash => credential metadata
    mapping(bytes32 => RecordMetadata) public registry;

    /// @dev Tracks whether a hash has ever been registered (prevents re-issue)
    mapping(bytes32 => bool) private _exists;

    /// @dev Authorized gas wallets allowed to call issueCredentials (platform operators)
    mapping(address => bool) public authorizedOperators;

    // ─────────────────────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────────────────────

    event CredentialIssued(
        bytes32 indexed dataHash,
        string  indexed issuerDid,
        uint32  blockTime
    );

    event CredentialRevoked(
        bytes32 indexed dataHash,
        string  indexed issuerDid,
        address revokedBy,
        uint32  blockTime
    );

    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);

    // ─────────────────────────────────────────────────────────────
    //  Errors
    // ─────────────────────────────────────────────────────────────

    error ArrayLengthMismatch();
    error EmptyBatch();
    error BatchTooLarge(uint256 provided, uint256 max);
    error CredentialAlreadyExists(bytes32 dataHash);
    error CredentialNotFound(bytes32 dataHash);
    error CredentialAlreadyRevoked(bytes32 dataHash);
    error InvalidIssuerDid();
    error NotAuthorizedOperator();
    error DIDMismatch(bytes32 dataHash);

    // ─────────────────────────────────────────────────────────────
    //  Constants
    // ─────────────────────────────────────────────────────────────

    uint256 public constant MAX_BATCH_SIZE = 500;

    // ─────────────────────────────────────────────────────────────
    //  Modifiers
    // ─────────────────────────────────────────────────────────────

    modifier onlyOperator() {
        if (!authorizedOperators[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedOperator();
        }
        _;
    }

    
    constructor(address _initialOperator) Ownable(msg.sender) {
        require(_initialOperator != address(0), "CredentialRegistry: zero operator address");
        authorizedOperators[_initialOperator] = true;
        emit OperatorAdded(_initialOperator);
    }

   
    function issueCredentials(
        bytes32[] calldata _dataHashes,
        string[]  calldata _issuerDids
    )
        external
        onlyOperator
        whenNotPaused
        nonReentrant
    {
        uint256 len = _dataHashes.length;

        if (len == 0)                          revert EmptyBatch();
        if (len != _issuerDids.length)         revert ArrayLengthMismatch();
        if (len > MAX_BATCH_SIZE)              revert BatchTooLarge(len, MAX_BATCH_SIZE);

        uint32 ts = uint32(block.timestamp);

        for (uint256 i = 0; i < len; ) {
            bytes32 h = _dataHashes[i];
            string  memory did = _issuerDids[i];

            if (_exists[h])                    revert CredentialAlreadyExists(h);
            if (bytes(did).length == 0)        revert InvalidIssuerDid();

            registry[h] = RecordMetadata({
                issuerDid : did,
                blockTime : ts,
                isRevoked : false
            });
            _exists[h] = true;

            emit CredentialIssued(h, did, ts);

            unchecked { ++i; }
        }
    }

    
    function revokeCredential(
        bytes32 _dataHash,
        string  calldata _issuerDid
    )
        external
        onlyOperator
        whenNotPaused
        nonReentrant
    {
        if (!_exists[_dataHash])               revert CredentialNotFound(_dataHash);

        RecordMetadata storage rec = registry[_dataHash];

        if (rec.isRevoked)                     revert CredentialAlreadyRevoked(_dataHash);

        // DID ownership guard: the caller must supply the exact same DID stored at issue time
        if (
            keccak256(bytes(rec.issuerDid)) !=
            keccak256(bytes(_issuerDid))
        ) revert DIDMismatch(_dataHash);

        rec.isRevoked = true;

        emit CredentialRevoked(_dataHash, _issuerDid, msg.sender, uint32(block.timestamp));
    }

  

   
    function getCredential(bytes32 _dataHash)
        external
        view
        returns (
            string  memory issuerDid,
            uint32  blockTime,
            bool    isRevoked,
            bool    exists
        )
    {
        exists    = _exists[_dataHash];
        RecordMetadata memory rec = registry[_dataHash];
        issuerDid = rec.issuerDid;
        blockTime = rec.blockTime;
        isRevoked = rec.isRevoked;
    }

    
    function credentialExists(bytes32 _dataHash) external view returns (bool) {
        return _exists[_dataHash];
    }

    
    function getCredentialsBatch(bytes32[] calldata _dataHashes)
        external
        view
        returns (RecordMetadata[] memory)
    {
        RecordMetadata[] memory results = new RecordMetadata[](_dataHashes.length);
        for (uint256 i = 0; i < _dataHashes.length; ) {
            results[i] = registry[_dataHashes[i]];
            unchecked { ++i; }
        }
        return results;
    }

    // ─────────────────────────────────────────────────────────────
    //  Operator Management (Owner Only)
    // ─────────────────────────────────────────────────────────────

   
    function addOperator(address _operator) external onlyOwner {
        require(_operator != address(0), "CredentialRegistry: zero address");
        authorizedOperators[_operator] = true;
        emit OperatorAdded(_operator);
    }

    
    function removeOperator(address _operator) external onlyOwner {
        authorizedOperators[_operator] = false;
        emit OperatorRemoved(_operator);
    }

    // ─────────────────────────────────────────────────────────────
    //  Emergency Controls (Owner Only)
    // ─────────────────────────────────────────────────────────────

    /// @notice Pauses all write operations. Read functions remain active.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Resumes write operations after a pause.
    function unpause() external onlyOwner {
        _unpause();
    }
}
