import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const DEFAULT_SESSION_TIMEOUT_MS = 3000;

class TauriInvokeTimeoutError extends Error {
  constructor(command, timeoutMs) {
    super(`${command} timed out after ${timeoutMs}ms`);
    this.name = "TauriInvokeTimeoutError";
  }
}

function invokeWithTimeout(command, args, timeoutMs) {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TauriInvokeTimeoutError(command, timeoutMs));
    }, timeoutMs);
  });

  const commandCall =
    args === undefined ? invoke(command) : invoke(command, args);

  return Promise.race([commandCall, timeout]).finally(() => {
    clearTimeout(timeoutId);
  });
}

export function isTauriInvokeTimeout(error) {
  return error instanceof TauriInvokeTimeoutError;
}

export async function setCredentials(phone) {
  return invoke("set_credentials", { phone });
}

export async function startAuth() {
  return invoke("start_auth");
}

export async function submitCode(code) {
  return invoke("submit_code", { code });
}

export async function checkPassword(password) {
  return invoke("check_password", { password });
}

export async function isAuthorized() {
  return invoke("is_authorized");
}

export async function fetchTelegramProfile() {
  return invoke("get_profile");
}

export async function restoreSession(options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_SESSION_TIMEOUT_MS;
  return invokeWithTimeout("restore_session", undefined, timeoutMs);
}

export async function signOut() {
  return invoke("sign_out");
}

export async function createChannel(name, encrypted = true) {
  return invoke("create_channel", { name, encrypted });
}

export async function getCachedChannels() {
  return invoke("get_cached_channels");
}

export async function listChannels() {
  return invoke("list_channels");
}

export async function renameChannel(channelId, name) {
  return invoke("rename_channel", { channelId, name });
}

export async function deleteChannel(channelId) {
  return invoke("delete_channel", { channelId });
}

export async function setupStorage(channelId, accessHash, encrypted) {
  return invoke("setup_storage", { channelId, accessHash, encrypted });
}

export async function isStorageReady() {
  return invoke("is_storage_ready");
}

export async function listFiles(channelId, accessHash, encrypted) {
  return invoke("list_files", { channelId, accessHash, encrypted });
}

export async function createFolder(
  channelId,
  accessHash,
  name,
  parentId = "",
  encrypted = false,
) {
  return invoke("create_folder", {
    channelId,
    accessHash,
    name,
    parentId,
    encrypted,
  });
}

export async function uploadFile(name, dataBase64, parentId) {
  return invoke("upload_file", { name, dataBase64, parentId });
}

export async function uploadFileFromPath(name, path, parentId) {
  return invoke("upload_file_from_path", { name, path, parentId });
}

export async function cancelUpload() {
  return invoke("cancel_upload");
}

export async function onUploadProgress(callback) {
  return listen("upload-progress", (event) => {
    callback(event.payload);
  });
}

export async function renameItem(
  channelId,
  accessHash,
  messageId,
  newName,
  encrypted = false,
) {
  return invoke("rename_item", {
    channelId,
    accessHash,
    messageId,
    newName,
    encrypted,
  });
}

export async function deleteItem(channelId, accessHash, messageId) {
  return invoke("delete_item", { channelId, accessHash, messageId });
}

export async function saveFileTo(messageId, destPath, downloadId) {
  return invoke("save_file_to", { messageId, destPath, downloadId });
}

export async function cacheAndOpenFile(messageId) {
  return invoke("cache_and_open_file", { messageId });
}

export async function getFileData(messageId) {
  return invoke("get_file_data", { messageId });
}

export async function cleanFileCache() {
  return invoke("clean_file_cache");
}

export async function downloadFolder(folderId, destPath, downloadId) {
  return invoke("download_folder", { folderId, destPath, downloadId });
}

export async function onDownloadProgress(callback) {
  return listen("download-progress", (event) => {
    callback(event.payload);
  });
}

export async function createDacin(name) {
  return invoke("create_dacin", { name });
}

export async function switchDacin(name) {
  return invoke("switch_dacin", { name });
}

export async function openUrl(url) {
  return invoke("open_url", { url });
}

export async function renameDacin(oldName, newName) {
  return invoke("rename_dacin", { oldName, newName });
}

export async function deleteDacin(name) {
  return invoke("delete_dacin", { name });
}

export async function listDacinChannels() {
  return invoke("list_dacin_channels");
}

export async function getCachedDacinList() {
  return invoke("get_cached_dacin_list");
}

export async function getCachedThumbnail(fileId) {
  return invoke("get_cached_thumbnail", { fileId });
}

export async function cacheThumbnail(fileId, thumbData) {
  return invoke("cache_thumbnail", { fileId, thumbData });
}
