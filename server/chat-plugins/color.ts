nameColor: function (name, bold, userGroup) {
    let userGroupSymbol = Users.usergroups[toID(name)]
        ? `<b><font color=#948A88>${Users.usergroups[toID(name)].substr(0, 1)}</font></b>`
        : "";

    let color = (() => {
        let id = toID(name);
       // if (customColors[id]) return customColors[id];
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

        let rgb = (() => {
            let C = ((100 - Math.abs(2 * L - 100)) * S) / 100 / 100;
            let X = C * (1 - Math.abs((H / 60) % 2 - 1));
            let m = L / 100 - C / 2;
            let r, g, b;

            switch (Math.floor(H / 60)) {
                case 1: r = X; g = C; b = 0; break;
                case 2: r = 0; g = C; b = X; break;
                case 3: r = 0; g = X; b = C; break;
                case 4: r = X; g = 0; b = C; break;
                case 5: r = C; g = 0; b = X; break;
                default: r = C; g = X; b = 0; break;
            }
            return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
        })();

        let finalColor = `#${((1 << 24) | (rgb.r << 16) | (rgb.g << 8) | rgb.b).toString(16).slice(1)}`;
        colorCache[id] = finalColor;
        return finalColor;
    })();

    return `${userGroup ? userGroupSymbol : ""}${bold ? "<b>" : ""}<font color="${color}">${Users(name) && Users(name).connected && Users.getExact(name) ? Chat.escapeHTML(Users.getExact(name).name) : Chat.escapeHTML(name)}</font>${bold ? "</b>" : ""}`;
}

export const commands: ChatCommands = {
    namecolor(target, room, user) {
        if (!target) target = user.name;
        if (!this.runBroadcast()) return;

        const coloredName = nameColor(target, true);
        this.sendReplyBox(`The name color for: ${coloredName}`);
    },
    namecolorhelp: ["/namecolor [name] - Displays the formatted name with its chat color."],
};

