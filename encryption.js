const crypto = require("crypto");
const encrypt = (text, iv, sharedKey) => {
	const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(sharedKey, "hex"), iv);
	let encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
	const auth_tag = cipher.getAuthTag().toString("hex");
	const payload = iv.toString("hex") + encrypted + auth_tag;
	const payload64 = Buffer.from(payload, "hex").toString("base64");
	const bob_payload = Buffer.from(payload64, "base64").toString("hex");
	const userEncrypted = bob_payload.substr(32, bob_payload.length - 32 - 32);
	return {
		iv: iv.toString("hex"),
		content: encrypted.toString("hex"),
		auth_tag: cipher.getAuthTag().toString("hex"),
		userEncrypted,
	};
};
function decrypt(text, iv, sharedKey, auth_tag, userEncrypted) {
	if (!text || !iv || !sharedKey)
		return {
			errorCode: 204,
			message: `Invalid Provided Fields`,
		};

	const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(sharedKey, "hex"), Buffer.from(iv, "hex"));

	decipher.setAuthTag(Buffer.from(auth_tag, "hex"));

	let decrypted = decipher.update(text, "hex", "utf8");
	decrypted += decipher.final("utf8");
	return {
		iv,
		auth_tag,
		content: decrypted.toString("hex"),
	};
}
function newUserKeys() {
	const serverUser = crypto.createECDH("secp256k1");
	serverUser.generateKeys();
	const newUser = crypto.createECDH("secp256k1");
	newUser.generateKeys();

	const serverSecret = serverUser.computeSecret(newUser.getPublicKey().toString("base64"), "base64", "hex");
	const newUserSecret = newUser.computeSecret(serverUser.getPublicKey().toString("base64"), "base64", "hex");

	const serverPublicKey = serverUser.getPublicKey("base64");
	const newUserPublicKey = newUser.getPublicKey("base64");

	const serverPrivatecKey = serverUser.getPrivateKey("base64");

	const newUserPrivateKey = newUser.getPrivateKey("base64");

	return {
		public: newUserPublicKey,
		serverPublic: serverPublicKey,
		secret: serverSecret,
		private: newUserPrivateKey,
		serverPrivate: serverPrivatecKey,
	};
}

module.exports = {
	encrypt,
	decrypt,
	newUserKeys,
};
