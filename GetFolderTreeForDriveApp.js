/**
 * ### Description
 * Get folder tree using DriveApp (Drive service) from own drive and shared drive.
 * 
 * ref: https://developers.google.com/apps-script/reference/drive
 * 
 * Required scopes: 
 * - `https://www.googleapis.com/auth/drive.readonly`
 */
class GetFolderTreeForDriveApp {

  /**
   *
   * @param {Object} object Source folder ID.
   * @param {String} object.id Source folder ID. Default is root folder.
   */
  constructor(object) {
    const { id = "root" } = object;

    /** @private */
    this.id = id;
  }

  /**
   * ### Description
   * Get folder tree.
   *
   * @param {Object} object Object for retrieving folder tree.
   * @returns {Array} Array including folder tree.
   */
  getTree(object = {}) {
    const loop = object => {
      const { id = this.id, parents = { ids: [], names: [] }, folders = [] } = object;
      const folder = DriveApp.getFolderById(id);
      if (parents.ids.length == 0) {
        parents.ids.push(id);
        parents.names.push(folder.getName());
      }
      const pid = [...parents.ids];
      const pn = [...parents.names];
      const fols = folder.getFolders();
      const folderList = [];
      while (fols.hasNext()) {
        const f = fols.next();
        folderList.push({ id: f.getId(), treeIds: [...pid, f.getId()], treeNames: [...pn, f.getName()] });
      }
      if (folderList.length > 0) {
        folders.push(...folderList);
        folderList.forEach(({ id, treeIds, treeNames }) =>
          loop({ id, parents: { ids: treeIds, names: treeNames }, folders })
        );
      }
      return folders.map(({ treeIds, treeNames }) => ({ treeIds, treeNames }));
    }
    return loop(object);
  }

  /**
   * ### Description
   * Get folder tree with files in each folder.
   *
   * @param {Object} object Object for retrieving folder tree with files.
   * @returns {Array} Array including folder tree with files.
   */
  getTreeWithFiles(object = {}) {
    const loop = object => {
      const { id = this.id, parents = { ids: [], names: [] }, folders = [] } = object;
      const folder = DriveApp.getFolderById(id);
      if (parents.ids.length == 0) {
        parents.ids.push(id);
        parents.names.push(folder.getName());
        folders.push({ id, treeIds: parents.ids, treeNames: parents.names, parent: { folderId: id, folderName: folder.getName() }, fileList: this.getFiles_(folder) });
      }
      const pid = [...parents.ids];
      const pn = [...parents.names];
      const fols = folder.getFolders();
      const folderList = [];
      while (fols.hasNext()) {
        const f = fols.next();
        const folderId = f.getId();
        const folderName = f.getName();
        folderList.push({ id: f.getId(), treeIds: [...pid, folderId], treeNames: [...pn, folderName], parent: { folderId, folderName }, fileList: this.getFiles_(f) });
      }
      if (folderList.length > 0) {
        folders.push(...folderList);
        folderList.forEach(({ id, treeIds, treeNames }) =>
          loop({ id, parents: { ids: treeIds, names: treeNames }, folders })
        );
      }
      return folders.map(({ treeIds, treeNames, parent, fileList }) => ({ treeIds, treeNames, parent, fileList }));
    }
    return loop(object);
  }

  /**
   * ### Description
   * Get filename with path.
   *
   * @param {String} delimiter Delimiter for showing path. Default is "/".
   * @returns {Array} Array including filenames including each path.
   */
  getFilenameWithPath(delimiter = "/") {
    return this.getTreeWithFiles().flatMap(({ treeNames, fileList }) => {
      const path = treeNames.join(delimiter);
      return fileList.map(({ name }) => `${path}${delimiter}${name}`);
    });
  }

  /**
   * ### Description
   * Get files under a folder.
   *
   * @param {DriveApp.Folder} folder Folder object.
   * @returns {Array} Array including files.
   * @private
   */
  getFiles_(folder) {
    const fileList = [];
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      fileList.push({ name: file.getName(), id: file.getId(), mimeType: file.getMimeType() });
    }
    return fileList;
  }
}
