function sample1() {
  const folderId = "###"; // Please set the folder ID.

  const obj = new GetFolderTreeForDriveApp({ id: folderId }).getTree();
  console.log(JSON.stringify(obj));
}

function sample2() {
  const folderId = "###"; // Please set the folder ID.

  const obj = new GetFolderTreeForDriveApp({ id: folderId }).getTreeWithFiles();
  console.log(JSON.stringify(obj));
}

function sample3() {
  const folderId = "###"; // Please set the folder ID.

  const obj = new GetFolderTreeForDriveApp({ id: folderId }).getFilenameWithPath();
  console.log(JSON.stringify(obj));
}
