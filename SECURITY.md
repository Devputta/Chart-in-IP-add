<p align="center">
  <img src="https://raw.githubusercontent.com/Devputta/Drafts-might-be-needed-/main/LOGO/Gemini_Generated_Image_1ppnm1ppnm1ppnm1%20(1).jfif" width="100" height="100" alt="CipherLink Logo" style="border-radius: 20px;" />
</p>

<h1 align="center">CipherLink Security & Cryptographic Model</h1>

<p align="center">
  <strong>Zero-Knowledge Architecture • Threat Model • Cryptographic Verification</strong>
</p>

---

## 1. Security Architecture & Threat Model

CipherLink is constructed under an adversarial threat model where the network layer and relay servers are assumed to be untrusted. All user communications must be rendered unreadable to eavesdroppers, relay operators, and network interceptors.

```
       [Untrusted Network / Hostile Relay]
                       │
       ┌───────────────▼───────────────┐
       │   WebSocket Relay (Server)    │
       │                               │
       │   • Can see: Room PIN ("234") │
       │   • Can see: Ciphertext blob  │
       │   • CANNOT see: Message text  │
       │   • CANNOT see: Photos/Videos │
       │   • CANNOT see: PDF documents │
       │   • CANNOT see: AES keys      │
       └───────────────▲───────────────┘
                       │
          Encrypted Payload Over TLS
                       │
  ┌────────────────────┴────────────────────┐
  │                                         │
┌─┴───────────────────────┐       ┌─────────┴─────────────┐
│    Alice's Browser      │       │     Bob's Browser     │
│  (Isolated Web Crypto)  │       │ (Isolated Web Crypto) │
│                         │       │                       │
│ • AES-256 Key in memory │       │ • AES-256 Key memory  │
│ • Plaintext in DOM only │       │ • Plaintext DOM only  │
└─────────────────────────┘       └───────────────────────┘
```

---

## 2. Cryptographic Specifications

CipherLink relies exclusively on the **W3C Web Cryptography API** (`window.crypto.subtle`), standard in modern browsers (Chrome, Firefox, Safari, Edge). The implementation avoids hand-rolled cryptography.

### Key Derivation Function (PBKDF2)
- **Algorithm**: PBKDF2-HMAC-SHA-256
- **Iteration Count**: 120,000 iterations (OWASP recommendations)
- **Salt Structure**: Domain-separated UTF-8 buffer (`cipherlink:v1:channel:<PIN>`)
- **Key Output**: 256-bit symmetric key (`AES-GCM`)

### Authenticated Symmetric Encryption (AES-GCM)
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Length**: 256 bits
- **Initialization Vector (IV)**: 96-bit (12-byte) cryptographically secure pseudorandom number generated freshly for every message using `crypto.getRandomValues`.
- **Integrity Tag**: 128-bit authentication tag appended to the ciphertext. Tampering with even a single bit causes immediate authentication failure on the recipient's device.

---

## 3. Threat Model Evaluation

### Supported Security Guarantees
| Threat Vector | Mitigation Strategy | Status |
|---|---|---|
| **Eavesdropping on Relay** | All message bodies, attachments, and metadata payloads are AES-256-GCM encrypted before dispatch. | Mitigated |
| **Man-in-the-Middle Modification** | AES-GCM provides authenticated encryption. Any payload altered in transit fails integrity check. | Mitigated |
| **Third-Party Eavesdropping in Room** | Rooms strictly enforce a maximum of 2 simultaneous WebSocket connections. Excess connections are terminated. | Mitigated |
| **Server Database Breaches** | No database or file storage exists on the relay. Messages exist exclusively in volatile browser RAM. | Mitigated |
| **Long-Term Data Retention** | Messages can be set to auto-delete (30 seconds / 5 minutes) or deleted manually on demand. | Mitigated |

### Explicit Limitations & User Responsibilities
- **Channel Code Entropy**: Channel codes (e.g., 3 to 6 digits) are designed for casual rendezvous convenience. They do not possess high entropy. Anyone who obtains or guesses the channel code before the intended peer joins can enter the channel. **Always transmit channel codes to your partner over a trusted, private communication channel.**
- **Endpoint Security**: CipherLink runs inside the user's web browser. It cannot protect against physical device seizure, screen recording software, keyloggers, or malicious browser extensions installed on the participant's device.
- **Traffic Metadata**: The relay operator can observe connection timing, source IP addresses, and encrypted packet volume. Users requiring IP-level anonymity should route connections through Tor or a VPN.

---

## 4. Zero Data Theft & No Telemetry Policy

CipherLink adheres to strict zero-knowledge principles:

- **No Cookies**: No session tracking or marketing cookies are stored.
- **No Analytics**: No Google Analytics, Segment, Amplitude, Mixpanel, or third-party monitoring beacons are included.
- **No Account Profiles**: No email addresses, phone numbers, or passwords are asked or stored.
- **No Logging of Ciphertext**: The server does not write message payloads to log files.
- **Security Headers**: Standard defense-in-depth headers are configured:
  - `Referrer-Policy: no-referrer`
  - Strict Content-Type sniffing prevention (`X-Content-Type-Options: nosniff`)

---

## 5. Vulnerability Disclosure Policy

If you discover a security vulnerability or cryptographic implementation flaw, please report it responsibly:

- **Maintainer**: Devputta / CipherLink Core Maintainers
- **Repository Issues**: [github.com/Devputta/CipherLink-](https://github.com/Devputta/CipherLink-.git)
- **Contact Email**: `mahadevumpgowda@gmail.com`

Please include:
1. Detailed description of the suspected issue.
2. Reproduction steps or theoretical exploit scenario.
3. Relevant environment information.

Confirmed security reports will receive prompt attention, patches, and public attribution.
