/**
 * ### Description
 * Get folder tree using Drive API from own drive, shared drive and service account's drive.
 * When you want to retrieve the folder tree from the service account, please give the access token from the service account.
 * 
 * ref: https://developers.google.com/drive/api/reference/rest/v3
 * 
 * Required scopes:
 * - `https://www.googleapis.com/auth/drive.metadata.readonly`
 * - `https://www.googleapis.com/auth/script.external_request`
 */
class GetFolderTreeForDriveAPI {

  /**
   *
   * @param {Object} object Source folder ID.
   * @param {String} object.id Source folder ID. Default is root folder.
   */
  constructor(object) {
    const { id = "root", accessToken = ScriptApp.getOAuthToken() } = object;

    /** @private */
    this.id = id;

    /** @private */
    this.headers = { authorization: `Bearer ${accessToken}` };

    /** @private */
    this.url = "https://www.googleapis.com/drive/v3/files";

    if (typeof Drive == "undefined" || Drive.getVersion() != "v3") {
      throw new Error("Please enable Drive API v3 at Advanced Google services. ref: https://developers.google.com/apps-script/guides/services/advanced#enable_advanced_services");
    }
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
      if (parents.ids.length == 0) {
        const folder = JSON.parse(UrlFetchApp.fetch(this.addQueryParameters_(`${this.url}/${id}`, { supportsAllDrives: true, fields: "name" }), { headers: this.headers }).getContentText());
        parents.ids.push(id);
        parents.names.push(folder.name);
      }
      const pid = [...parents.ids];
      const pn = [...parents.names];
      const query = {
        q: `'${id}' in parents and mimeType='${MimeType.FOLDER}' and trashed=false`,
        fields: "files(id,name,parents),nextPageToken",
        pageSize: 1000,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      };
      const folderList = [];
      let pageToken = "";
      do {
        const res = UrlFetchApp.fetch(this.addQueryParameters_(this.url, query), { headers: this.headers });
        const obj = JSON.parse(res.getContentText());
        if (obj.files.length > 0) {
          folderList.push(...obj.files.map(o => ({ id: o.id, treeIds: [...pid, o.id], treeNames: [...pn, o.name] })));
        }
        pageToken = obj.nextPageToken;
        query.pageToken = pageToken;
      } while (pageToken);
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
      if (parents.ids.length == 0) {
        const folder = JSON.parse(UrlFetchApp.fetch(this.addQueryParameters_(`${this.url}/${id}`, { supportsAllDrives: true, fields: "name" }), { headers: this.headers }).getContentText());
        parents.ids.push(id);
        parents.names.push(folder.name);
        folders.push({ id, treeIds: parents.ids, treeNames: parents.names, parent: { folderId: id, folderName: folder.name }, fileList: this.getFiles_({ id }) });
      }
      const pid = [...parents.ids];
      const pn = [...parents.names];
      const query = {
        q: `'${id}' in parents and mimeType='${MimeType.FOLDER}' and trashed=false`,
        fields: "files(id,name,parents),nextPageToken",
        pageSize: 1000,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      };
      const folderList = [];
      let pageToken = "";
      do {
        const res = UrlFetchApp.fetch(this.addQueryParameters_(this.url, query), { headers: this.headers });
        const obj = JSON.parse(res.getContentText());
        if (obj.files.length > 0) {
          folderList.push(...obj.files.map(o =>
            ({ id: o.id, treeIds: [...pid, o.id], treeNames: [...pn, o.name], parent: { folderId: o.id, folderName: o.name }, fileList: this.getFiles_(o) })
          ));
        }
        pageToken = obj.nextPageToken;
        query.pageToken = pageToken;
      } while (pageToken);
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
   * @param {Object} object Object including folder ID.
   * @returns {Array} Array including files.
   * @private
   */
  getFiles_(object) {
    const { id } = object;
    const query = {
      q: `'${id}' in parents and mimeType!='${MimeType.FOLDER}' and trashed=false`,
      fields: "files(id,name,mimeType),nextPageToken",
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    };
    const fileList = [];
    let pageToken = "";
    do {
      const res = UrlFetchApp.fetch(this.addQueryParameters_(this.url, query), { headers: this.headers });
      const obj = JSON.parse(res.getContentText());
      if (obj.files.length > 0) {
        fileList.push(...obj.files.map(o => ({ name: o.name, id: o.id, mimeType: o.mimeType })));
      }
      pageToken = obj.nextPageToken;
      query.pageToken = pageToken;
    } while (pageToken);
    return fileList;
  }

  /**
   * ### Description
   * This method is used for adding the query parameters to the URL.
   * Ref: https://github.com/tanaikech/UtlApp?tab=readme-ov-file#addqueryparameters
   * 
   * @param {String} url The base URL for adding the query parameters.
   * @param {Object} obj JSON object including query parameters.
   * @return {String} URL including the query parameters.
   * @private
   */
  addQueryParameters_(url, obj) {
    if (url === null || obj === null || typeof url != "string") {
      throw new Error("Please give URL (String) and query parameter (JSON object).");
    }
    return (url == "" ? "" : `${url}?`) + Object.entries(obj).flatMap(([k, v]) => Array.isArray(v) ? v.map(e => `${k}=${encodeURIComponent(e)}`) : `${k}=${encodeURIComponent(v)}`).join("&");
  }
}
