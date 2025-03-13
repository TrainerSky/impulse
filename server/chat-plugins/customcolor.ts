/**
 * Pokémon Showdown Custom Color Plugin
 *
 * - Stores custom colors in `config/customcolors.json`
 * - Modifies only ` Custom Username Colors ` block in `custom.css`
 * - Ensures `/customcolor delete` only removes the targeted user
 *
 * - Original Authors: panpawn, jd, and other contributors
 * - Refactored & Optimized By: TrainerSky
 */

import { FS } from '../../lib/fs';

const CSS_FILE = 'config/custom.css';
const COLOR_STORAGE = 'config/customcolors.json';
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

// Function to check if a user has a custom color
function hasCustomColor(userid: string): boolean {
    return Object.prototype.hasOwnProperty.call(userColors, userid);
}

// Function to list all custom colors
function listAllColors(): string {
    if (Object.keys(userColors).length === 0) return "No users have custom colors set.";
    return Object.entries(userColors)
        .map(([userid, color]) => `<span style="color:${color}">${userid}</span>: ${color}`)
        .join("<br>");
}

// Pokémon Showdown Chat Plugin Commands
export const commands = {
    customcolor: {
        set(target, room, user) {
            if (!user.named) return this.errorReply("You must be logged in to use this command.");
            if (!user.can('mute')) return this.errorReply("You must be a Moderator (@) or higher to use this command.");
            
            const [targetUser, color] = target.split(',').map(param => param.trim());
            if (!targetUser || !color) return this.errorReply("Usage: /customcolor set [username], [hex code]");
            if (!/^#([0-9A-F]{6})$/i.test(color) || color.toUpperCase() === "#FFFFFF") {
                return this.errorReply("Invalid color! Use a hex code like #FF5733 (White `#FFFFFF` is blocked).");
            }

            const targetID = toID(targetUser);
            userColors[targetID] = color;
            saveColors();
            this.sendReply(`Set custom color for ${targetUser}: ${color}`);
        },
        delete(target, room, user) {
            if (!user.named) return this.errorReply("You must be logged in to use this command.");
            if (!user.can('mute')) return this.errorReply("You must be a Moderator (@) or higher to reset colors.");
            if (!target) return this.errorReply("Usage: /customcolor delete [username]");

            const targetID = toID(target);
            if (!hasCustomColor(targetID)) return this.errorReply(`${target} does not have a custom color.`);

            delete userColors[targetID];
            saveColors();
            this.sendReply(`Reset ${target}'s name color to default.`);
        },
        list(target, room, user) {
            if (!user.can('mute')) return this.errorReply("You must be a Moderator (@) or higher to use this command.");
            this.sendReplyBox(`<strong>Users with Custom Colors:</strong><br>${listAllColors()}`);
        },
        preview(target, room, user) {
            if (!user.named) return this.errorReply("You must be logged in to use this command.");
            const [targetUser, color] = target.split(',').map(param => param.trim());
            if (!targetUser || !color) return this.errorReply("Usage: /customcolor preview [username], [hex code]");

            this.sendReplyBox(`<strong>Preview:</strong> <span style="color: ${color}">${targetUser}</span>`);
        },
        reload(target, room, user) {
            if (!user.can('hotpatch')) return this.errorReply("You must be an Admin (&) to reload colors.");
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
