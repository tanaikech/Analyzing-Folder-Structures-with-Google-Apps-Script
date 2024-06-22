# Analyzing Folder Structures with Google Apps Script

# Abstract

This report provides a Google Apps Script to retrieve all files, including those within subfolders, for a designated folder. It addresses the challenges of retrieving files within deeply nested folder structures and obtaining complete file paths.

# Introduction

Google Apps Script empowers developers to interact with Google Drive data programmatically, unlocking a wide range of functionalities. A core component of this interaction is the Drive service (DriveApp) and Drive API. These services provide programmatic control over files and folders within your Drive.

While retrieving all files and folders within your Drive and just under a specific folder is straightforward, managing nested subfolders within a specific folder presents a greater challenge. On forums like Stackoverflow, users frequently encounter difficulties retrieving files buried deep within complex folder structures (folder trees) and obtaining complete file paths for these files.

This report bridges this gap by presenting a custom Google Apps Script designed to efficiently retrieve all files, encompassing those nestled within subfolders, for a designated folder. We'll explore the script's inner workings and provide a sample script as a reference. By understanding this script, you'll be well-equipped to leverage Google Apps Script for developing powerful applications that interact seamlessly with your Google Drive data.

# Usage

## 1. Create a Google Apps Script project

Please create a Google Apps Script project. You can use both the standalone script and the container-bound script.

## 2. Prepare folder

In order to test this script, please prepare a folder including the subfolders and the files. In this report, I used the following folder including the subfolders and the files as a sample folder.

![](images/fig1.png)

## 3. Scripts

I would like to introduce the following 2 patterned scripts as class objects.

### 1. Using Drive service (DriveApp)

In this pattern, Drive service (DriveApp) is used. The sample class object is as follows. Please copy and paste the following class object to the script editor.

In this case, it is NOT required to enable Drive API at Advanced Google services.

**In this script, the folder trees can be obtained from your Drive and the shared drives.**

```javascript
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
```

#### Scopes

This class uses the following scopes.

- `https://www.googleapis.com/auth/drive.readonly`

#### Sample scripts

The sample script for using this class **GetFolderTreeForDriveApp** is as follows. Also, please copy and paste the following script to the same script editor.

##### getTree method of class GetFolderTreeForDriveApp

```javascript
function sample1() {
  const folderId = "###"; // Please set the folder ID.

  const obj = new GetFolderTreeForDriveApp({ id: folderId }).getTree();
  console.log(JSON.stringify(obj));
}
```

When the function `sample1` is run to the above sample folder, the following result is obtained.

```
[
  {
    "treeIds": ["ID of sampleTopFolder", "ID of folder_2"],
    "treeNames": ["sampleTopFolder", "folder_2"]
  },
  {
    "treeIds": ["ID of sampleTopFolder", "ID of folder_1"],
    "treeNames": ["sampleTopFolder", "folder_1"]
  },
  {
    "treeIds": ["ID of sampleTopFolder", "ID of folder_2", "ID of folder_2_1"],
    "treeNames": ["sampleTopFolder", "folder_2", "folder_2_1"]
  },
  {
    "treeIds": ["ID of sampleTopFolder", "ID of folder_2", "ID of folder_2_1", "ID of folder_2_1_1"],
    "treeNames": ["sampleTopFolder", "folder_2", "folder_2_1", "folder_2_1_1"]
  },
  {
    "treeIds": ["ID of sampleTopFolder", "ID of folder_1", "ID of folder_1_2"],
    "treeNames": ["sampleTopFolder", "folder_1", "folder_1_2"]
  },
  {
    "treeIds": ["ID of sampleTopFolder", "ID of folder_1", "ID of folder_1_1"],
    "treeNames": ["sampleTopFolder", "folder_1", "folder_1_1"]
  }
]
```

##### getTreeWithFiles method of class GetFolderTreeForDriveApp

```javascript
function sample2() {
  const folderId = "###"; // Please set the folder ID.

  const obj = new GetFolderTreeForDriveApp({ id: folderId }).getTreeWithFiles();
  console.log(JSON.stringify(obj));
}
```

When the function `sample2` is run to the above sample folder, the following result is obtained.

```
[
  {
    "treeIds": ["ID of sampleTopFolder"],
    "treeNames": ["sampleTopFolder"],
    "parent": { "folderId": "ID of sampleTopFolder", "folderName": "sampleTopFolder" },
    "fileList": [
      { "name": "sample_file_1.txt", "id": "###", "mimeType": "text/plain" }
    ]
  },
  {
    "treeIds": ["ID of sampleTopFolder", "ID of folder_2"],
    "treeNames": ["sampleTopFolder", "folder_2"],
    "parent": { "folderId": "ID of folder_2", "folderName": "folder_2" },
    "fileList": [
      { "name": "sample_file_6.txt", "id": "###", "mimeType": "text/plain" },
      { "name": "sample_file_5.txt", "id": "###", "mimeType": "text/plain" }
    ]
  },
  {
    "treeIds": ["ID of sampleTopFolder", "ID of folder_1"],
    "treeNames": ["sampleTopFolder", "folder_1"],
    "parent": { "folderId": "ID of folder_1", "folderName": "folder_1" },
    "fileList": [
      { "name": "sample_file_4.txt", "id": "###", "mimeType": "text/plain" },
      { "name": "sample_file_3.txt", "id": "###", "mimeType": "text/plain" },
      { "name": "sample_file_2.txt", "id": "###", "mimeType": "text/plain" }
    ]
  },
  {
    "treeIds": ["ID of sampleTopFolder", "ID of folder_2", "ID of folder_2_1"],
    "treeNames": ["sampleTopFolder", "folder_2", "folder_2_1"],
    "parent": { "folderId": "ID of folder_2_1", "folderName": "folder_2_1" },
    "fileList": [
      { "name": "sample_file_7.txt", "id": "###", "mimeType": "text/plain" }
    ]
  },
  {
    "treeIds": ["ID of sampleTopFolder", "ID of folder_2", "ID of folder_2_1", "ID of folder_2_1_1"],
    "treeNames": ["sampleTopFolder", "folder_2", "folder_2_1", "folder_2_1_1"],
    "parent": { "folderId": "ID of folder_2_1_1", "folderName": "folder_2_1_1" },
    "fileList": []
  },
  {
    "treeIds": ["ID of sampleTopFolder", "ID of folder_1", "ID of folder_1_2"],
    "treeNames": ["sampleTopFolder", "folder_1", "folder_1_2"],
    "parent": { "folderId": "ID of folder_1_2", "folderName": "folder_1_2" },
    "fileList": [
      { "name": "sample_file_8.txt", "id": "###", "mimeType": "text/plain" }
    ]
  },
  {
    "treeIds": ["ID of sampleTopFolder", "ID of folder_1", "ID of folder_1_1"],
    "treeNames": ["sampleTopFolder", "folder_1", "folder_1_1"],
    "parent": { "folderId": "ID of folder_1_1", "folderName": "folder_1_1" },
    "fileList": [
      { "name": "sample_file_9.txt", "id": "###", "mimeType": "text/plain" }
    ]
  }
]
```

##### getFilenameWithPath method of class GetFolderTreeForDriveApp

```javascript
function sample3() {
  const folderId = "###"; // Please set the folder ID.

  const obj = new GetFolderTreeForDriveApp({
    id: folderId,
  }).getFilenameWithPath();
  console.log(JSON.stringify(obj));
}
```

When the function `sample3` is run to the above sample folder, the following result is obtained. In this case, in order to have high readability, the order was sorted by the filename.

When `const obj = new GetFolderTreeForDriveApp({ id: folderId }).getFilenameWithPath("---");` is run, the delimiter of path uses `---`.

```
[
  "sampleTopFolder/sample_file_1.txt",
  "sampleTopFolder/folder_1/sample_file_2.txt",
  "sampleTopFolder/folder_1/sample_file_3.txt",
  "sampleTopFolder/folder_1/sample_file_4.txt",
  "sampleTopFolder/folder_2/sample_file_5.txt",
  "sampleTopFolder/folder_2/sample_file_6.txt",
  "sampleTopFolder/folder_2/folder_2_1/sample_file_7.txt",
  "sampleTopFolder/folder_1/folder_1_2/sample_file_8.txt",
  "sampleTopFolder/folder_1/folder_1_1/sample_file_9.txt"
]
```

### 2. Using Drive API

In this pattern, Drive API is used. The sample class object is as follows. Please copy and paste the following class object to the script editor.

And, please enable Drive API at Advanced Google services.

**In this script, the folder trees can be obtained from your Drive, the shared drives, and the drive of the service account.**

```javascript
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
```

#### Scopes

This class uses the following scopes.

- `https://www.googleapis.com/auth/drive.metadata.readonly`
- `https://www.googleapis.com/auth/script.external_request`

#### Sample scripts

The sample script for using this class **GetFolderTreeForDriveAPI** is as follows. Also, please copy and paste the following script to the same script editor.

##### getTree method of class GetFolderTreeForDriveAPI

```javascript
function sample4() {
  const folderId = "###"; // Please set the folder ID.

  const obj = new GetFolderTreeForDriveAPI({ id: folderId }).getTree();
  console.log(JSON.stringify(obj));
}
```

When the function `sample4` is run to the above sample folder, the same result with the above `sample1` is obtained.

##### getTreeWithFiles method of class GetFolderTreeForDriveAPI

```javascript
function sample5() {
  const folderId = "###"; // Please set the folder ID.

  const obj = new GetFolderTreeForDriveAPI({ id: folderId }).getTreeWithFiles();
  console.log(JSON.stringify(obj));
}
```

When the function `sample5` is run to the above sample folder, the same result with the above `sample2` is obtained.

##### getFilenameWithPath method of class GetFolderTreeForDriveAPI

```javascript
function sample6() {
  const folderId = "###"; // Please set the folder ID.

  const obj = new GetFolderTreeForDriveAPI({
    id: folderId,
  }).getFilenameWithPath();
  console.log(JSON.stringify(obj));
}
```

When the function `sample6` is run to the above sample folder, the same result with the above `sample3` is obtained.

##### Use of service account

This class **GetFolderTreeForDriveAPI** can retrieve the folder tree from the drive of the service account. In the case of `new GetFolderTreeForDriveAPI({ id: folderId })`, the access token is retrieved by `ScriptApp.getOAuthToken()`. If you want to retrieve the folder tree from the drive of the service account, please give the access token retrieved from the service account. The sample script is as follows. The function `getAccessTokenFromServiceAccount_` is from [my post](https://tanaikech.github.io/2018/12/07/retrieving-access-token-for-service-account-using-google-apps-script/).

```javascript
/**
 * ### Description
 * Get access token from service account.
 * ref: https://tanaikech.github.io/2018/12/07/retrieving-access-token-for-service-account-using-google-apps-script/
 *
 * @param {Object} object Object including private_key, client_email, impersonate_email.
 * @param {String} object.private_key
 * @param {String} object.client_email
 * @param {String} object.impersonate_email
 * @param {Array} object.scopes
 * @returns {String} Access token.
 */
function getAccessTokenFromServiceAccount_(object) {
  const { private_key, client_email, impersonate_email = "", scopes = [] } = object;
  const url = "https://www.googleapis.com/oauth2/v4/token";
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = { iss: client_email, scope: scopes.join(" "), aud: url, exp: (now + 3600).toString(), iat: now.toString() };
  if (impersonate_email != "") {
    claim.sub = impersonate_email;
  }
  const signature = Utilities.base64Encode(JSON.stringify(header)) + "." + Utilities.base64Encode(JSON.stringify(claim));
  const jwt = signature + "." + Utilities.base64Encode(Utilities.computeRsaSha256Signature(signature, private_key));
  const params = { payload: { assertion: jwt, grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer" } };
  const res = UrlFetchApp.fetch(url, params);
  const { access_token } = JSON.parse(res.getContentText());
  return access_token;
}

function sample() {
  const object = {
    private_key: "-----BEGIN PRIVATE KEY-----\n###-----END PRIVATE KEY-----\n",
    client_email: "###",
    scopes: ["https://www.googleapis.com/auth/drive.metadata.readonly"],
  };
  const accessToken = getAccessTokenFromServiceAccount_(object);

  const obj = new GetFolderTreeForDriveAPI({ id: "root", accessToken }).getFilenameWithPath();
  console.log(JSON.stringify(obj))
}
```

When this script is run, all files are retrieved from the drive of the service account with the file path.

---

<a name="licence"></a>

# Licence

[MIT](LICENCE)

<a name="author"></a>

# Author

[Tanaike](https://tanaikech.github.io/about/)

[Donate](https://tanaikech.github.io/donate/)

<a name="updatehistory"></a>

# Update History

- v1.0.0 (June 22, 2024)

  1. Initial release.

[TOP](#top)
