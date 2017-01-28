<style>
    .info {
        padding: 20px;
        background-color: lightblue;
        border-radius: 2px;
        border-color: blue;
        color: black;
    }
</style>

# The KentChat Protocol

## Synopsis

One of KentChat's top goals is to provide an instant messaging experience that puts an emphasis on the user's privacy. To make this possible, the KentChat protocol is encrypted using RSA, and account credentials are hashed using BLAKE2. The usage of these algorithms is documented below.

## Systems Used

- [RSA](https://en.wikipedia.org/wiki/RSA_%28cryptosystem%29)
- [BLAKE2](https://en.wikipedia.org/wiki/BLAKE2)
- [AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)

## Procedures Taken

### Server

#### Initialization

1. Server generates itself a public and private key for RSA encryption

#### <a name="server-msg-to-client" /> Send encrypted message to client

1. Generate a random key for AES
2. Sign the BLAKE2 hash of the plain-text message with private key
3. Encrypt plain-text message with AES using generated AES key
4. Encrypt AES key using client's public key
5. Send a packet of encrypted (with AES) message, encrypted AES key, and signature to client

#### <a name="server-msg-from-client" /> Receive encrypted message from client

1. Separate received packet into message, key, and signature
2. Decrypt the AES key using the client's private key
3. Decrypt the message using the AES key
4. Validate the signature with the server's public key and the BLAKE2 hash of the decrypted message

#### As client connects

1. Server receives public key from client
2. Server responds with its public key
3. Client generates a key for future AES encryption and sends it to server, encrypted with server's public key and signed with client's private key
4. Server decrypts the message and evaluates the signature, aborting the connection if it's invalid; Otherwise server initiates the first standard encrypted message by encrypting `helo` with its received AES key, and signing `helo`'s SHA3-256 hash with server's private key. Server then sends the encrypted content together with the signature to client
5. Client decrypts and evaluates server's packet, aborting the connection if signature is invalid; Otherwise client bounces the decrypted message back to server, encrypting it with the AES key and signing its SHA3-256 hash with client's private key (client sends the encrypted content and signature in the same manner as server)
6. Server decrypts the received message and evaluates the signature, aborting the connection if it's invalid; Otherwise, compare the decrypted message with the original message, aborting the connection if they don't match. Finally server sends to client `start_encrypted`, processed in the same manner as when it sent the original `helo`.

At this point, the server's packets to the client contain two parts: The first parts are encrypted with the common AES key; The second parts are the server's signatures for the SHA3-256 hash of the their corresponding first parts. The client's packets to the server are in the same format. This encryption scheme applies for all packets after `start_encrypted` and before `end_encrypted`.

#### User login
1. `auth`: Client sends its authentication to the server in the format of `{username: <hashed username>, password: <hashed password>}`, hashed using SHA3-256
2. Server attempts to authenticate user; If credentials correct, then reply `auth_good` with a 16-digit base64 token (for user identification later); otherwise, reply `auth_bad` and abort connection

#### User sends a private message to another user

<div class="info"><b>Zero knowledge</b>: The server does not know what your message is -- all it receives is your message encrypted with your recipient's public key, only decrypt-able by your recipient using their private key.</div>

1. `req_pubkey`: Client requests the public key of its chosen recipient
2. Server responds with the recipient's public key with `pubkey_ok`, or `pubkey_idk` for unknown recipient
3. `tunnel`: Client sends the encrypted private message (total with the client's private key, the server's public key, and the recipient's public key) to its intended recipient by sending a `tunnel` command to the server
4. Server forwards the private message to the recipient
5. The recipient decrypts the private message using their private key, obtaining the client's private message in plain text.
6. `tunnel`+`recvd`: Recipient sends confirmation receipt to server
7. `recvd`: Server forwards confirmation receipt to client

A private message packet consists of three parts:
1. The message itself, encrypted with AES using a predetermined key
2. The signature, generated from the sender's private key and the message's BLAKE2 hashsum. Must be validated by the recipient
3. The predetermined AES key, encrypted with the recipient's public key and only decrypt-able by the recipient
