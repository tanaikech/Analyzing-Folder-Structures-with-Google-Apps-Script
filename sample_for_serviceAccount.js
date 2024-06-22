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
