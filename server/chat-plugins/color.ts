export const commands: ChatCommands = {
	previewcolor(target, room, user) {
		if (!target) return this.sendReply("Usage: /previewcolor [username]");

		const name = target.trim();
		if (!name) return this.sendReply("Error: You must provide a username.");

		// Get color
		const colorHex = usernameColor(name);

		// Display result
		this.sendReplyBox(
			`<b>Username Color Preview for ${name}:</b> <br>
			<span style="color: ${colorHex}; font-weight: bold;">${name}</span> 
			<br>Color Code: <code>${colorHex}</code>`
		);
	},

	colorhex(target, room, user) {
		const name = target.trim() || user.name;
		const colorHex = usernameColor(name);

		this.sendReplyBox(
			`<b>Current Username Color for ${name}:</b> <br>
			<span style="color: ${colorHex}; font-weight: bold;">${name}</span> 
			<br>Hex Code: <code>${colorHex}</code>`
		);
	},
};

// =======================
// Global Cache
// =======================
const colorCache: Record<string, string> = {};

// =======================
// Utility Functions
// =======================

function usernameColor(name: string): string {
	if (!name) throw new Error("usernameColor() called without a name.");

	if (colorCache[name]) return colorCache[name];

	let hash = MD5(name);
	let H = parseInt(hash.substr(4, 4), 16) % 360; // 0 to 360
	let S = parseInt(hash.substr(0, 4), 16) % 50 + 40; // 40 to 89
	let L = Math.floor(parseInt(hash.substr(8, 4), 16) % 20 + 30); // 30 to 49

	let { R, G, B } = HSLToRGB(H, S, L);
	let lum = R ** 3 * 0.2126 + G ** 3 * 0.7152 + B ** 3 * 0.0722;

	let HLmod = (lum - 0.2) * -150;
	if (HLmod > 18) HLmod = (HLmod - 18) * 2.5;
	else if (HLmod < 0) HLmod /= 3;
	else HLmod = 0;

	let Hdist = Math.min(Math.abs(180 - H), Math.abs(240 - H));
	if (Hdist < 15) HLmod += (15 - Hdist) / 3;

	L += HLmod;

	let { R: r, G: g, B: b } = HSLToRGB(H, S, L);
	const toHex = (x: number) => x.toString(16).padStart(2, '0');
	colorCache[name] = `#${toHex(Math.round(r * 255))}${toHex(Math.round(g * 255))}${toHex(Math.round(b * 255))}`;
	return colorCache[name];
}

function HSLToRGB(H: number, S: number, L: number) {
	let C = (100 - Math.abs(2 * L - 100)) * S / 10000;
	let X = C * (1 - Math.abs((H / 60) % 2 - 1));
	let m = L / 100 - C / 2;

	let R1 = 0, G1 = 0, B1 = 0;
	switch (Math.floor(H / 60)) {
		case 1: R1 = X; G1 = C; break;
		case 2: G1 = C; B1 = X; break;
		case 3: G1 = X; B1 = C; break;
		case 4: R1 = X; B1 = C; break;
		case 5: R1 = C; B1 = X; break;
		default: R1 = C; G1 = X;
	}

	return { R: R1 + m, G: G1 + m, B: B1 + m };
}
