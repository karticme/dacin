use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::Aes256Gcm;
use argon2::Argon2;
use base64::Engine;
use uuid::Uuid;

pub(crate) fn aes_encrypt(key: &[u8; 32], plaintext: &[u8]) -> Result<(Vec<u8>, Vec<u8>), String> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| format!("Invalid key: {e}"))?;
    let iv = Uuid::new_v4().as_bytes()[..12].to_vec();
    let nonce = aes_gcm::aead::Nonce::<Aes256Gcm>::from_slice(&iv);
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| format!("Encryption failed: {e}"))?;
    Ok((ciphertext, iv))
}

#[allow(dead_code)]
pub(crate) fn aes_decrypt(key: &[u8; 32], ciphertext: &[u8], iv: &[u8]) -> Result<Vec<u8>, String> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| format!("Invalid key: {e}"))?;
    let nonce = aes_gcm::aead::Nonce::<Aes256Gcm>::from_slice(iv);
    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("Decryption failed: {e}"))
}

pub(crate) fn encrypt_b64(key: &[u8; 32], plaintext: &[u8]) -> Result<String, String> {
    let (ciphertext, iv) = aes_encrypt(key, plaintext)?;
    let mut combined = iv;
    combined.extend_from_slice(&ciphertext);
    Ok(crate::util::BASE64.encode(&combined))
}

#[allow(dead_code)]
pub(crate) fn decrypt_b64(key: &[u8; 32], encoded: &str) -> Result<Vec<u8>, String> {
    let combined = crate::util::BASE64
        .decode(encoded.as_bytes())
        .map_err(|e| format!("Base64 decode failed: {e}"))?;
    if combined.len() < 12 {
        return Err("Encrypted blob is too short".to_string());
    }
    let (iv, ciphertext) = combined.split_at(12);
    aes_decrypt(key, ciphertext, iv)
}

pub(crate) fn derive_key(secret: &str, salt_b64: &str) -> Result<[u8; 32], String> {
    let salt = crate::util::BASE64
        .decode(salt_b64.as_bytes())
        .map_err(|e| format!("Invalid salt: {e}"))?;
    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(secret.as_bytes(), &salt, &mut key)
        .map_err(|e| format!("Key derivation failed: {e}"))?;
    Ok(key)
}

pub(crate) fn generate_salt() -> Result<String, String> {
    let salt_bytes = Uuid::new_v4().as_bytes().to_vec();
    Ok(crate::util::BASE64.encode(&salt_bytes))
}
