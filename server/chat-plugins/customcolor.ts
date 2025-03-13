/**
 * Pokémon Showdown Custom Color Plugin
 *
 * - Stores custom colors in `config/customcolors.json`
 * - Modifies only ` Custom Username Colors ` block in `custom.css`
 * - Ensures `/customcolor delete` only removes the targeted user
 *
 * - Original Authors: panpawn, jd, and other contributors
 * - Refactored & Updated for Latest API By: Prince Sky
 */

import { FS } from '../../lib/fs';

const CSS_FILE = 'config/custom.css';
const COLOR_STORAGE = 'db/customcolors.json';
let userColors: { [userid: string]: string } = {};

// Load stored colors from file
function loadColors(): void {
    try {
        userColors = JSON.parse(FS(COLOR_STORAGE).readSync());
    } catch (e) {
        userColors = {};
    }
}

// Save colors and update `custom.css`
function saveColors(): void {
    FS(COLOR_STORAGE).writeUpdate(() => JSON.stringify(userColors, null, 2));
    updateCSSFile();
}

// Update `custom.css` while preserving all other styles
function updateCSSFile(): void {
    let cssContent = FS(CSS_FILE).readIfExistsSync() || "";
    let cssLines = cssContent.split("\n");

    // Locate existing custom color block
    const startIndex = cssLines.indexOf("/* Custom Username Colors */");
    const endIndex = cssLines.indexOf("/* End Custom Username Colors */");

    // Remove previous custom colors only
    if (startIndex !== -1 && endIndex !== -1) {
        cssLines.splice(startIndex, endIndex - startIndex + 1);
    }

    // Generate new CSS block
    let newCSS = ["/* Custom Username Colors */"];
    for (const userid in userColors) {
        newCSS.push(generateCSS(userid, userColors[userid]));
    }
    newCSS.push("/* End Custom Username Colors */");

    // Append new CSS block at the correct position
    if (startIndex !== -1) {
        cssLines.splice(startIndex, 0, ...newCSS);
    } else {
        cssLines.push(...newCSS);
    }

    FS(CSS_FILE).writeUpdate(() => cssLines.join("\n"));
}

// Generate CSS for chat messages & userlist
function generateCSS(userid: string, color: string): string {
    userid = toID(userid);
    return `[class*="chatmessage-${userid}"] strong, [id*="userlist-user-${userid}"] strong, [id*="userlist-user-${userid}"] span {\n color: ${color} !important;\n}`;
}

// Pokémon Showdown Chat Plugin Commands (Updated for Latest API)
export const commands = {
    customcolor: {
        set(target, room, user) {
            this.checkCan('mute'); // Latest API for permissions

            const [targetUser, color] = target.split(',').map(param => param.trim());
            if (!targetUser || !color) return this.parse('/help customcolor');
            if (!/^#([0-9A-F]{6})$/i.test(color) || color.toUpperCase() === "#FFFFFF") {
                return this.errorReply("Invalid color! Use a hex code like #FF5733 (White `#FFFFFF` is blocked).");
            }

            const targetID = toID(targetUser);
            userColors[targetID] = color;
            saveColors();

            this.modlog('CUSTOMCOLOR', targetUser, `Set color to ${color}`);
            this.sendReply(`Set custom color for ${targetUser}: ${color}`);
        },
        delete(target, room, user) {
            this.checkCan('mute'); // Latest API for permissions
            if (!target) return this.parse('/help customcolor delete');

            const targetID = toID(target);
            if (!userColors[targetID]) return this.errorReply(`${target} does not have a custom color.`);

            delete userColors[targetID];
            saveColors();

            this.modlog('CUSTOMCOLOR', target, 'Reset color');
            this.sendReply(`Reset ${target}'s name color to default.`);
        },
        list(target, room, user) {
            if (!this.runBroadcast()) return; // Latest API for broadcasting
            if (Object.keys(userColors).length === 0) return this.sendReply("No users have custom colors set.");

            let colorList = Object.entries(userColors)
                .map(([userid, color]) => `<span style="color:${color}">${userid}</span>: ${color}`)
                .join("<br>");

            this.sendReplyBox(`<strong>Users with Custom Colors:</strong><br>${colorList}`);
        },
        preview(target, room, user) {
            if (!this.runBroadcast()) return;
            const [targetUser, color] = target.split(',').map(param => param.trim());
            if (!targetUser || !color) return this.parse('/help customcolor preview');

            this.sendReplyBox(`<strong>Preview:</strong> <span style="color: ${color}">${targetUser}</span>`);
        },
        reload(target, room, user) {
            this.checkCan('hotpatch');
            saveColors();
            this.privateModAction(`(${user.name} has reloaded custom colors.)`);
        },
    },
    customcolorhelp: [
        "Commands Include:",
        "/customcolor set [user], [hex] - Gives [user] a custom color of [hex]",
        "/customcolor delete [user] - Removes [user]'s custom color",
        "/customcolor list - Lists all users with custom colors",
        "/customcolor reload - Reloads all custom colors",
        "/customcolor preview [user], [hex] - Shows what the color looks like",
    ],
};

// Load colors on startup
loadColors();
