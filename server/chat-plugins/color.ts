function generateColor(name: string): string {
    let id = toID(name);
    if (colorCache[id]) return colorCache[id];

    let hash = MD5(id);
    let H = parseInt(hash.substr(4, 4), 16) % 360;
    let S = parseInt(hash.substr(0, 4), 16) % 50 + 40;
    let L = Math.floor(parseInt(hash.substr(8, 4), 16) % 20 + 30);
    let C = ((100 - Math.abs(2 * L - 100)) * S) / 100 / 100;
    let X = C * (1 - Math.abs((H / 60) % 2 - 1));
    let m = L / 100 - C / 2;

    let R1, G1, B1;
    switch (Math.floor(H / 60)) {
        case 1: R1 = X; G1 = C; B1 = 0; break;
        case 2: R1 = 0; G1 = C; B1 = X; break;
        case 3: R1 = 0; G1 = X; B1 = C; break;
        case 4: R1 = X; G1 = 0; B1 = C; break;
        case 5: R1 = C; G1 = 0; B1 = X; break;
        default: R1 = C; G1 = X; B1 = 0; break;
    }

    let lum = (R1 + m) * 0.2126 + (G1 + m) * 0.7152 + (B1 + m) * 0.0722;
    let HLmod = (lum - 0.5) * -100;
    if (HLmod > 12) HLmod -= 12;
    else if (HLmod < -10) HLmod = (HLmod + 10) * 2 / 3;
    else HLmod = 0;

    L += HLmod;
    let Smod = 10 - Math.abs(50 - L);
    if (HLmod > 15) Smod += (HLmod - 15) / 2;
    S -= Smod;

    let C2 = ((100 - Math.abs(2 * L - 100)) * S) / 100 / 100;
    let X2 = C2 * (1 - Math.abs((H / 60) % 2 - 1));
    let m2 = L / 100 - C2 / 2;

    let r, g, b;
    switch (Math.floor(H / 60)) {
        case 1: r = X2; g = C2; b = 0; break;
        case 2: r = 0; g = C2; b = X2; break;
        case 3: r = 0; g = X2; b = C2; break;
        case 4: r = X2; g = 0; b = C2; break;
        case 5: r = C2; g = 0; b = X2; break;
        default: r = C2; g = X2; b = 0; break;
    }

    let finalColor = `#${((1 << 24) | (Math.round((r + m2) * 255) << 16) | (Math.round((g + m2) * 255) << 8) | Math.round((b + m2) * 255)).toString(16).slice(1)}`;
    colorCache[id] = finalColor;
    return finalColor;
}

function nameColor(name: string, bold = false, userGroup = false): string {
    let userGroupSymbol = Users.usergroups[toID(name)]
        ? `<b><font color=#948A88>${Users.usergroups[toID(name)].charAt(0)}</font></b>`
        : "";

    let color = generateColor(name);
    let formattedName = Users(name) && Users(name).connected && Users.getExact(name) 
        ? Chat.escapeHTML(Users.getExact(name).name) 
        : Chat.escapeHTML(name);

    return `${userGroup ? userGroupSymbol : ""}${bold ? "<b>" : ""}<font color="${color}">${formattedName}</font>${bold ? "</b>" : ""}`;
}

export const commands: ChatCommands = {
    color(target, room, user) {
        if (!this.runBroadcast()) return;

        let targetUser = target.trim() || user.name;
        let formattedName = nameColor(targetUser, true, true); 

        this.sendReplyBox(`Your name color: ${formattedName}`);
    },
};
