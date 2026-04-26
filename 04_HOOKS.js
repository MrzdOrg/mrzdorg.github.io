// 04_HOOKS.js — инициализация системы хуков пострендера.
// Если отключить: defaults.js создаст PulseHooks автоматически.
// Сигнатура хука и описание полей — см. defaults.js (PulseHooks.postRender).

window.PulseHooks ||= { postRender: [] };

window.PulseModules ||= {};
window.PulseModules['04_HOOKS.js'] = true;
