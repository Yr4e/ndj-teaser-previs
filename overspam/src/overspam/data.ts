/** Данные игры OVERSPAM: картинки вынуты из билда (public/overspam/game) и с overspam.com (public/overspam/site). */

export const GAME = (name: string) => `overspam/game/256x256_${name}.png`;
export const CARD = (name: string) => `overspam/game/224x304_${name}.png`;

export const HEROES = [
  "brakka", "wizzle", "grindbone", "bongo", "cosmonaut", "glitch",
  "lunamoth", "deadletter", "corvus", "arcademon", "junkpaw", "spammer",
] as const;
export const HERO_IMG = (h: string) => `overspam/site/heroes/${h}.webp`;

/** 30 оружий с известными иконками (тот же набор, что в D:\gamexd\assets\weapon-icons) */
export const WEAPONS = [
  "forward_blade", "flame_mail", "static_router", "burn_notice", "junk_boulders", "ricochet_femur",
  "ping_bow", "six_shot", "spam_guard", "return_receipt", "signal_aura", "hatchet_hash",
  "fiber_noodle", "long_ping_rifle", "junk_rocket", "bulk_mailer", "popup_mines", "packet_dagger",
  "frozen_inbox", "viral_twister", "cancel_cleaver", "blood_pact", "null_inbox", "toxic_attachment",
  "quick_unsend", "flame_thread", "loot_dice", "champion_blade", "corrupted_file", "spam_reaper",
];

/** Остальные 85 иконок 256×256 из билда: предметы */
export const ITEMS = [
  "admin_wrench", "angry_intern", "blood_bank", "bloodthirsty_cursor", "blue_screen_flash", "brass_keycaps",
  "bulk_padding", "caps_lock", "cold_storage", "commission_sneakers", "cozy_campfire", "ctrl_z",
  "cursed_attachment", "dark_mode_goggles", "data_hoarder", "echo_reply", "energy_drink", "escalation_ticket",
  "escape_key", "featherweight_firmware", "firewall_shield", "first_aid_kit", "flame_war", "forbidden_soda",
  "forge_firmware", "fork_bomb", "four_leaf_cookie", "frost_byte", "ghost_courier", "ghost_mailer",
  "ghost_protocol", "gold_mine_glove", "golden_signature", "grandmas_chain_letter", "heavy_ring", "hot_take",
  "idle_process", "inbox_vacuum", "insurance_policy", "leech_gloves", "lightning_router", "loyalty_card",
  "malware_gloves", "master_key", "mirror_server", "moldy_sandwich", "oatmeal_bar", "old_avatar",
  "overclocked_chassis", "overclocked_psu", "panic_mode", "paper_plane_scarf", "poltergeist_process", "power_strip",
  "precision_glasses", "prickly_captcha", "protein_patch", "pumpkin_spice_update", "racing_stripes", "red_ink_stamp",
  "reply_all_blast", "retry_loop", "server_core", "sharp_packets", "signal_beacon", "skull_emoji",
  "smartwatch", "spam_cannon", "spam_filter_mask", "spare_battery", "spiked_reply", "static_mitts",
  "store_credit", "takeout_burger", "teflon_ring", "terms_of_service", "tome_expansion", "toxic_leak",
  "turbo_rollers", "unstable_patch", "unsubscribe_link", "uplink_claw", "usb_hub", "viral_payload", "voodoo_bot",
];

export const TOMES = [
  "armor", "attack_speed", "chaos", "crit_chance", "damage", "difficulty", "duration", "evasion",
  "gold_gain", "hp_regen", "knockback", "lifesteal", "luck", "max_hp", "move_speed", "pickup_range",
  "projectile_count", "projectile_size", "projectile_speed", "shield", "silver_gain", "thorns", "xp_gain",
];

export const WORLDS = [
  {id: "forest", name: "FOREST", color: "#8fdc6a"},
  {id: "moon", name: "MOON", color: "#6ff3ff"},
  {id: "deadnet", name: "DEAD INTERNET", color: "#ff4fd8"},
  {id: "dunes", name: "SUNSCAR DUNES", color: "#ffc547"},
  {id: "abyss", name: "ABYSS DOME", color: "#3ff2e0"},
] as const;
export const WORLD_IMG = (id: string) => `overspam/site/worlds/${id}.webp`;

export const BOSSES = [
  {id: "rootmaw", name: "ROOTMAW COLOSSUS", world: 0},
  {id: "tyrant", name: "MOON TYRANT", world: 1},
  {id: "mainframe", name: "THE MAINFRAME", world: 2},
  {id: "pharaoh", name: "SUN PHARAOH", world: 3},
  {id: "captain", name: "THE SHARK CAPTAIN", world: 4},
] as const;

export const BG = "#07070d";
export const GOLD = "#ffc547";
