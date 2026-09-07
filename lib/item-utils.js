/**
 * Utilities for file and folder items (type checking, thumbnails, breadcrumb calculation, sorting).
 */

/**
 * Checks whether an item is a folder.
 * @param {Object} item
 * @returns {boolean}
 */
export function isFolderItem(item) {
  if (!item) return false;
  return (
    item.itemType === "folder" ||
    item.type === "folder" ||
    item.item_type === "folder"
  );
}

/**
 * Gets the thumbnail URL for an item.
 * @param {Object} item
 * @returns {string}
 */
export function getItemThumbnail(item) {
  if (!item) return "/item-thumbnails/document.png";
  if (item.thumbnail) return item.thumbnail;
  return isFolderItem(item)
    ? "/item-thumbnails/folder.png"
    : "/item-thumbnails/document.png";
}

/**
 * Gets a human-readable display string for the item's type/mime.
 * @param {Object} item
 * @returns {string}
 */
export function getItemTypeDisplay(item) {
  if (isFolderItem(item)) return "Folder";
  return item?.mimeType || item?.mime_type || "File";
}

/**
 * Builds the breadcrumb hierarchy for a given folder in the items list.
 * @param {Array} items - List of all channel items
 * @param {string} currentFolderId - ID of current folder or empty string for root
 * @param {string} rootName - Display name of root channel
 * @returns {Array<{id: string, name: string}>}
 */
export function buildFolderBreadcrumbs(items = [], currentFolderId = "", rootName = "Channel") {
  const root = [{ id: "", name: rootName || "Channel" }];
  if (!currentFolderId) return root;

  const folderChain = [];
  let currentId = currentFolderId;
  let guard = 0;

  while (currentId && guard < 50) {
    guard++;
    const folder = items.find((i) => i.id === currentId && isFolderItem(i));
    if (!folder) break;
    folderChain.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId || folder.parent_id || "";
  }

  return [...root, ...folderChain];
}

/**
 * Filters items belonging to a specific parent folder and optional search query.
 * @param {Array} items
 * @param {string} parentFolderId
 * @param {string} [searchQuery=""]
 * @returns {Array}
 */
export function getFolderItems(items = [], parentFolderId = "", searchQuery = "") {
  return items.filter((item) => {
    const itemParent = item.parentId || item.parent_id || "";
    const matchesFolder = itemParent === parentFolderId;
    if (!matchesFolder) return false;

    if (searchQuery && searchQuery.trim()) {
      return item.name?.toLowerCase().includes(searchQuery.trim().toLowerCase());
    }
    return true;
  });
}
