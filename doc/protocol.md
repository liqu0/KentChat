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

One of KentChat's top goals is to provide an instant messaging experience that puts an emphasis on the user's privacy. To make this possible, the KentChat protocol is encrypted using RSA, and account credentials are hashed using SHA-3. The usage of these algorithms is documented below.

## Systems Used

- [RSA](https://en.wikipedia.org/wiki/RSA_%28cryptosystem%29)
- [SHA-3](https://en.wikipedia.org/wiki/SHA-3)

## Procedures Taken

### Server

#### Initialization

1. Server generates itself a public and private key for RSA encryption

#### As client connects

1. Server receives public key from client
2. Server responds with its generated public key
3. Clients sends `helo` handshake to server, encrypted with its private key and the server's public key
4. Packet from client is checked by server once decrypted with its private key and the client's public key
5. If decrypted data seems random, reply to client `rsa_bad` in plain text and abort connection; If decrypted data is `helo`, reply to client `helo`, encrypted in client's public key and the server's private key
6. Client decrypts server's response with server's public key and client's private key; If decrypted data is `helo`, enable encrypted packets by default and respond `rsa_good` with the aforementioned order of encrypting its outward data (in step 3); otherwise, respond `rsa_bad` in plain text
7. Server determines if received data is plain-text; If it is, then abort connection; Otherwise, enable encrypted packets by default
8. Server sends to client: `start_encrypted`

At this point, the server's packets to the client are encrypted with the client's public key **first**, **then** the server's private key; The client decrypts these packets by **first** using the server's public key, **then** using its own private key. The client's packets to the server are encrypted with client's private key **first**, **then** the server's public key; The server decrpyts these packets by **first** using its own private key, **then** using the client's public key. This encryption scheme applies for all packets after `start_encrypted` and before `end_encrypted` in this particular session

#### User login
1. `auth`: Client sends its authentication to the server in the format of `{username: <hashed username>, password: <hashed password>}`, hashed using SHA-3 (256 bit)
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