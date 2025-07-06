import { themes, levelTypes } from './config.js';
import * as GameState from './gameState.js';
import { templates } from './templates.js';
import { vocabulary } from './vocabulary.js';

let lastLevelType = null;
let lastTemplateInfo = { type: null, index: -1 };

export function generateLevel(levelNumber, usedTemplates) {
    // Every 5 levels, the game is forced to pick a new type of challenge
    const levelTypeIndex = Math.floor((levelNumber - 1) / 5) % levelTypes.length;
    let type = levelTypes[levelTypeIndex];
    
    // For variation within the 5-level block, allow random selection but prioritize the block's main type
    if (Math.random() > 0.3) { // 70% chance to stick to the planned type
        type = levelTypes[levelTypeIndex];
    } else { // 30% chance for a different random type
        const otherTypes = levelTypes.filter(t => t !== type);
        type = otherTypes[Math.floor(Math.random() * otherTypes.length)];
    }

    // Avoid repeating the exact same template from the previous level
    const templatesForType = templates[type];
    const usedIndices = usedTemplates[type] || [];
    let availableIndices = [];
    for (let i = 0; i < templatesForType.length; i++) {
        // Exclude the very last template used if it's from the same type
        if (type === lastTemplateInfo.type && i === lastTemplateInfo.index) {
            continue;
        }
        if (!usedIndices.includes(i)) {
            availableIndices.push(i);
        }
    }
    
    // If all templates for this type have been used, reset and use any
    if (availableIndices.length === 0) {
        GameState.resetUsedTemplatesForType(type);
        for (let i = 0; i < templatesForType.length; i++) {
            // Still avoid the immediate last one if possible
            if (type === lastTemplateInfo.type && i === lastTemplateInfo.index && templatesForType.length > 1) {
                continue;
            }
            availableIndices.push(i);
        }
    }
    
    const templateIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    lastTemplateInfo = { type, index: templateIndex }; // Store last used template info
    const template = templatesForType[templateIndex];

    const level = { type, scenario: template.s, correctAnswer: template.c, templateIndex };
    
    // Fill template with random words
    for (const key in vocabulary) {
        const word = vocabulary[key][Math.floor(Math.random() * vocabulary[key].length)];
        const regex = new RegExp(`{${key}}`, "g");
        if (level.scenario) {
            level.scenario = level.scenario.replace(regex, word);
        }
        if (level.correctAnswer) {
            level.correctAnswer = level.correctAnswer.replace(regex, word);
        }
        if (template.b) {
            level.badPrompt = template.b.replace(regex, word);
        }
         if (template.w) {
            level.options = template.w.map(opt => opt.replace(regex, word));
            level.options.push(level.correctAnswer);
            level.options.sort(() => Math.random() - 0.5); // Shuffle options
        }
        if (template.f) {
            level.forbiddenWord = template.f.replace(regex, word);
        }
    }
    level.theme = themes[0]; // Always use the first (and only) theme
    return level;
}