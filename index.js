const HOOK_OPT = {order: 10, filter: {fake: null}},
	CLASS_MYSTIC = 7,
	SKILL_VOW_LOCKON = {type: 1, id: 120100},
	GLYPH_MULTIPLY = 27090

module.exports = function TripleVow(dispatch) {
	let hooks = []

	dispatch.hook('S_LOGIN', dispatch.majorPatchVersion >= 81 ? 13 : 12, HOOK_OPT, event => { if(event.templateId % 100 - 1 === CLASS_MYSTIC) load(event.gameId) })

	function load(gameId) {
		function hook() { hooks.push(dispatch.hook(...arguments)) }

		let extraTarget = false,
			locked = []

		hook('S_CREST_INFO', 2, HOOK_OPT, event => {
			const crest = event.crests.find(c => c.id === GLYPH_MULTIPLY)
			extraTarget = !!crest && crest.enable
		})

		hook('S_CREST_APPLY', 2, HOOK_OPT, event => { if(event.id === GLYPH_MULTIPLY) extraTarget = event.enable })

		hook('S_CAN_LOCKON_TARGET', 3, HOOK_OPT, event => {
			if(event.skill.equals(SKILL_VOW_LOCKON) && event.success) {
				if(locked.length >= (!extraTarget ? 2 : 3) || locked.some(id => id === event.target)) {
					event.success = false
					return true
				}

				locked.push(event.target)

				if(locked.length === (!extraTarget ? 1 : 2)) {
					event.success = false
					return true
				}
			}
		})

		hook('S_ACTION_END', 5, HOOK_OPT, event => {
			if(event.gameId === gameId && event.skill.equals(SKILL_VOW_LOCKON)) locked = []
		})

		hook('S_CREATURE_LIFE', 3, HOOK_OPT, event => { if(event.gameId === gameId && !event.alive) locked = [] })

		hook('S_RETURN_TO_LOBBY', 'raw', HOOK_OPT, () => { unload() })
	}

	function unload() {
		if(hooks.length) {
			for(let h of hooks) dispatch.unhook(h)

			hooks = []
		}
	}
}