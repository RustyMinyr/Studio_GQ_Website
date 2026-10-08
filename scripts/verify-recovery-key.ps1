$ErrorActionPreference = 'Stop'
$privateFile = 'C:\Users\brad\Documents\ChatGPT\Server build\.recovery\nimda-recovery-private.dpapi'
$encrypted = [IO.File]::ReadAllBytes((Join-Path $PSScriptRoot '..\.migration\backup-password.enc'))
$protected = [IO.File]::ReadAllBytes($privateFile)
$private = [Security.Cryptography.ProtectedData]::Unprotect($protected, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
$rsa = [Security.Cryptography.RSA]::Create()
try {
  $read = 0
  $rsa.ImportPkcs8PrivateKey($private, [ref]$read)
  $plain = $rsa.Decrypt($encrypted, [Security.Cryptography.RSAEncryptionPadding]::OaepSHA256)
  if ([Text.Encoding]::UTF8.GetString($plain).Trim() -notmatch '^[a-f0-9]{96}$') { throw 'Recovery key format mismatch' }
  Write-Output 'OFF_SERVER_RECOVERY_KEY_DECRYPTION_VERIFIED'
} finally {
  [Array]::Clear($private, 0, $private.Length)
  if ($plain) { [Array]::Clear($plain, 0, $plain.Length) }
  $rsa.Dispose()
}
