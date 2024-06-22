function sample4() {
  const folderId = "###"; // Please set the folder ID.

  const obj = new GetFolderTreeForDriveAPI({ id: folderId }).getTree();
  console.log(JSON.stringify(obj));
}

function sample5() {
  const folderId = "###"; // Please set the folder ID.

  const obj = new GetFolderTreeForDriveAPI({ id: folderId }).getTreeWithFiles();
  console.log(JSON.stringify(obj));
}

function sample6() {
  const folderId = "###"; // Please set the folder ID.

  const obj = new GetFolderTreeForDriveAPI({ id: folderId }).getFilenameWithPath();
  console.log(JSON.stringify(obj));
}
