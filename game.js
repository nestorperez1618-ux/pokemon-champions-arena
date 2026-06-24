// CONFIGURACIÓN DE TABLA DE TIPOS Y EFECTIVIDADES
const TABLA_TIPOS = {
    normal: { rock: 0.5, ghost: 0 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5 },
    electric: { water: 2, grass: 0.5, electric: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5 },
    ground: { fire: 2, poison: 2, electric: 2, grass: 0.5, bug: 0.5, flying: 0 },
    flying: { grass: 2, electric: 0.5, fighting: 2, bug: 2, rock: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2 },
    ghost: { normal: 0, psychic: 2, ghost: 2 },
    dragon: { dragon: 2 }
};

const ATAQUES_OFICIALES = {
    normal: { tipo: "normal", nombre: "Placaje", poder: 40, efecto: "💢" },
    fire: { tipo: "fire", nombre: "Llamarada", poder: 90, efecto: "🔥" },
    water: { tipo: "water", nombre: "Hidrobomba", poder: 90, efecto: "💧" },
    grass: { tipo: "grass", nombre: "Rayo Solar", poder: 90, efecto: "☀️" },
    electric: { tipo: "electric", nombre: "Rayo", poder: 90, efecto: "⚡" },
    ice: { tipo: "ice", nombre: "Rayo Hielo", poder: 90, efecto: "❄️" },
    fighting: { tipo: "fighting", nombre: "Onda Certera", poder: 100, efecto: "👊" },
    poison: { tipo: "poison", nombre: "Bomba Lodo", poder: 80, efecto: "🧪" },
    ground: { tipo: "ground", nombre: "Terremoto", poder: 100, efecto: "⛰️" },
    flying: { tipo: "flying", nombre: "Pájaro Osado", poder: 100, efecto: "🦅" },
    psychic: { tipo: "psychic", nombre: "Psíquico", poder: 90, efecto: "👁️" },
    bug: { tipo: "bug", nombre: "Zumbido", poder: 80, efecto: "🐝" },
    rock: { tipo: "rock", nombre: "Avalancha", poder: 75, efecto: "🪨" },
    ghost: { tipo: "ghost", nombre: "Bola Sombra", poder: 80, efecto: "👻" },
    dragon: { tipo: "dragon", nombre: "Pulso Dragón", poder: 85, efecto: "🐉" }
};

const estadoGlobal = { recordSala: 0, billeteraGlobal: 0 };

let cachePokedex = [];
let equipoJugador = []; // Lista de pokémon (hasta 3 vivos)
let pokemonActivoIdx = 0;

let salaActual = 1;
let modoJefeFinal = false;

let rivalActual = null;
let equipoJefeFinal = [];
let jefeActualIdx = 0;

const inicialesParaElegir = [
    { id: 1, nombre: "Bulbasaur", tipo: "grass", hpMax: 145, hp: 145, atk: 49, def: 49, spd: 45, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/1.gif" },
    { id: 4, nombre: "Charmander", tipo: "fire", hpMax: 139, hp: 139, atk: 52, def: 43, spd: 65, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/4.gif" },
    { id: 7, nombre: "Squirtle", tipo: "water", hpMax: 144, hp: 144, atk: 48, def: 65, spd: 43, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/7.gif" }
];

window.onload = function() {
    document.getElementById('txt-record-sala').innerText = `SALA ${estadoGlobal.recordSala}`;
    precargarDatosPokedex();
};

function irASeleccionStarter() {
    document.getElementById("main-menu-screen").style.display = "none";
    document.getElementById("starter-screen").style.display = "flex";
    renderizarOpcionesStarters();
}

function regresarAlMenu() {
    document.getElementById("starter-screen").style.display = "none";
    document.getElementById("main-menu-screen").style.display = "flex";
}

function renderizarOpcionesStarters() {
    const grid = document.getElementById("starter-options");
    grid.innerHTML = "";
    inicialesParaElegir.forEach(poke => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "starter-card";
        tarjeta.onclick = () => seleccionarStarter(poke);
        tarjeta.innerHTML = `<img src="${poke.sprite}" alt="${poke.nombre}"><h3>${poke.nombre}</h3>`;
        grid.appendChild(tarjeta);
    });
}

function seleccionarStarter(starterOriginal) {
    equipoJugador = [{ ...starterOriginal, vivo: true }];
    pokemonActivoIdx = 0;
    salaActual = 1;
    modoJefeFinal = false;

    document.getElementById("starter-screen").style.display = "none";
    document.getElementById("game-container").style.display = "flex";
    iniciarProximaSala();
}

// --- SECUENCIAS DE SALA Y RIVALES ---
async function iniciarProximaSala() {
    actualizarDockEquipo();
    const logger = document.getElementById("battle-log");
    logger.innerHTML = "";

    // Restaurar vida del pokémon activo al inicio de la sala
    const pokeActivo = equipoJugador[pokemonActivoIdx];
    if(pokeActivo) {
        pokeActivo.hp = pokeActivo.hpMax;
        pokeActivo.vivo = true;
    }

    if (!modoJefeFinal && salaActual <= 10) {
        document.getElementById("battle-sala-title").innerText = `SALA ${salaActual} / 10`;
        agregarAlLog(`¡Entrando a la Sala ${salaActual}!`, "system");

        let idRival = Math.floor(Math.random() * 149) + 1;
        rivalActual = await obtenerPokemonAPI(idRival);
        desplegarLuchadores();
    } else {
        modoJefeFinal = true;
        document.getElementById("battle-sala-title").innerText = `JEFE FINAL`;
        
        if (equipoJefeFinal.length === 0) {
            agregarAlLog("⚠️ ¡Alerta! El equipo de Élite del Jefe Final ha aparecido.", "crit");
            for(let i=0; i<3; i++){
                let idL = Math.floor(Math.random() * 149) + 1;
                equipoJefeFinal.push(await obtenerPokemonAPI(idL));
            }
            jefeActualIdx = 0;
        }

        rivalActual = equipoJefeFinal[jefeActualIdx];
        agregarAlLog(`El Jefe Final envía a su Pokémon N° ${jefeActualIdx + 1}: ${rivalActual.nombre.toUpperCase()}`, "rival");
        desplegarLuchadores();
    }
}

async function obtenerPokemonAPI(id) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await res.json();
    const tipo = data.types[0].type.name;
    const hpB = data.stats[0].base_stat + 50; 
    return {
        id: id, nombre: data.name, tipo: tipo, hpMax: hpB, hp: hpB,
        atk: data.stats[1].base_stat, def: data.stats[2].base_stat, spd: data.stats[5].base_stat,
        vivo: true,
        sprite: data.sprites.other.showdown.front_default || data.sprites.front_default
    };
}

function desplegarLuchadores() {
    const miPoke = equipoJugador[pokemonActivoIdx];

    // Jugador
    document.getElementById("player-sprite").src = miPoke.sprite;
    document.getElementById("player-name").innerText = miPoke.nombre;
    document.getElementById("player-badge-type").innerText = miPoke.tipo;
    
    // Rival
    document.getElementById("rival-sprite").src = rivalActual.sprite;
    document.getElementById("rival-name").innerText = rivalActual.nombre;
    document.getElementById("rival-badge-type").innerText = rivalActual.tipo;
    
    actualizarBarrasDeVida();
    renderizarAcciones();
}

function renderizarAcciones() {
    const grid = document.getElementById("battle-moves-grid");
    grid.innerHTML = "";
    
    const miPoke = equipoJugador[pokemonActivoIdx];
    // Movimiento 1 basado en el tipo de su elemento
    const m1 = ATAQUES_OFICIALES[miPoke.tipo] || ATAQUES_OFICIALES["normal"];
    // Movimiento 2 de cobertura (Placaje / Normal)
    const m2 = ATAQUES_OFICIALES["normal"];

    [m1, m2].forEach(mov => {
        const btn = document.createElement("button");
        btn.className = "btn-move";
        btn.onclick = () => ejecutarTurno(mov);
        btn.innerHTML = `<span class="move-name">${mov.nombre}</span><span class="move-type">${mov.tipo}</span>`;
        grid.appendChild(btn);
    });
}

function actualizarBarrasDeVida() {
    const miPoke = equipoJugador[pokemonActivoIdx];
    
    const pPct = Math.max(0, (miPoke.hp / miPoke.hpMax) * 100);
    document.getElementById("player-hp-bar").style.width = `${pPct}%`;
    document.getElementById("player-hp-text").innerText = `${miPoke.hp}/${miPoke.hpMax} HP`;

    const rPct = Math.max(0, (rivalActual.hp / rivalActual.hpMax) * 100);
    document.getElementById("rival-hp-bar").style.width = `${rPct}%`;
    document.getElementById("rival-hp-text").innerText = `${rivalActual.hp}/${rivalActual.hpMax} HP`;
}

// --- MOTOR MATRICIAL DE COMBATE ---
function ejecutarTurno(ataqueElegido) {
    const miPoke = equipoJugador[pokemonActivoIdx];
    
    if (miPoke.spd >= rivalActual.spd) {
        atacarJugador(ataqueElegido);
        if (rivalActual.hp > 0) setTimeout(() => atacarRival(), 1200);
    } else {
        atacarRival();
        if (miPoke.hp > 0) setTimeout(() => atacarJugador(ataqueElegido), 1200);
    }
}

function calcularMultiplicador(tAtq, tDef) {
    if (TABLA_TIPOS[tAtq] && TABLA_TIPOS[tAtq][tDef] !== undefined) {
        return TABLA_TIPOS[tAtq][tDef];
    }
    return 1.0;
}

function mostrarEfectoAtaque(idPanel, emojiEfecto) {
    const panel = document.getElementById(idPanel);
    panel.innerText = emojiEfecto;
    panel.style.display = "flex";
    setTimeout(() => { panel.style.display = "none"; }, 500);
}

function atacarJugador(ataque) {
    const miPoke = equipoJugador[pokemonActivoIdx];
    // Se usa el tipo del ataque para calcular la ventaja/desventaja contra el rival
    const mult = calcularMultiplicador(ataque.tipo, rivalActual.tipo);
    
    let danioBase = (((2 * 50 / 5 + 2) * ataque.poder * (miPoke.atk / rivalActual.def)) / 50) + 2;
    let danioFinal = Math.floor(danioBase * mult);

    rivalActual.hp = Math.max(0, rivalActual.hp - danioFinal);
    actualizarBarrasDeVida();

    mostrarEfectoAtaque("rival-anim-effect", ataque.efecto);

    let textoLog = `¡${miPoke.nombre.toUpperCase()} utiliza ${ataque.nombre}! Causa ${danioFinal} de daño.`;
    if (mult > 1) textoLog += " ¡Es SÚPER EFECTIVO! 💥";
    if (mult < 1 && mult > 0) textoLog += " Resistido... 🛡️";
    if (mult === 0) textoLog += " ¡Inmune! ❌";
    
    agregarAlLog(textoLog, "player");

    if (rivalActual.hp <= 0) {
        setTimeout(() => procesarVictoria(), 800);
    }
}

function atacarRival() {
    const miPoke = equipoJugador[pokemonActivoIdx];
    const atqRival = ATAQUES_OFICIALES[rivalActual.tipo] || ATAQUES_OFICIALES["normal"];
    
    // El ataque del rival usa su propio tipo elemental
    const mult = calcularMultiplicador(atqRival.tipo, miPoke.tipo);
    
    let danioBase = (((2 * 50 / 5 + 2) * atqRival.poder * (rivalActual.atk / miPoke.def)) / 50) + 2;
    let danioFinal = Math.floor(danioBase * mult);

    miPoke.hp = Math.max(0, miPoke.hp - danioFinal);
    actualizarBarrasDeVida();

    mostrarEfectoAtaque("player-anim-effect", atqRival.efecto);

    let textoLog = `¡El rival ${rivalActual.nombre.toUpperCase()} contraataca con ${atqRival.nombre}! Quita ${danioFinal} HP.`;
    if (mult > 1) textoLog += " ¡Daño crítico! 🔥";
    
    agregarAlLog(textoLog, "rival");

    if (miPoke.hp <= 0) {
        miPoke.vivo = false;
        actualizarDockEquipo();
        agregarAlLog(`💀 ${miPoke.nombre.toUpperCase()} ha caído debilitado.`, "crit");
        
        setTimeout(() => verificarCambioDePokemon(), 800);
    }
}

function verificarCambioDePokemon() {
    const proximoIdx = equipoJugador.findIndex(p => p.vivo);
    
    if (proximoIdx !== -1) {
        pokemonActivoIdx = proximoIdx;
        agregarAlLog(`➡️ ¡El siguiente miembro del equipo sale al combate: ${equipoJugador[pokemonActivoIdx].nombre.toUpperCase()}!`, "system");
        desplegarLuchadores();
    } else {
        alert("¡Todos los Pokémon de tu equipo han caído debilitados! El torneo ha terminado.");
        document.getElementById("game-container").style.display = "none";
        document.getElementById("main-menu-screen").style.display = "flex";
    }
}

// --- LOGÍSTICA CAPTURA Y GESTIÓN DE EQUIPO ---
function procesarVictoria() {
    if (modoJefeFinal) {
        jefeActualIdx++;
        if (jefeActualIdx >= equipoJefeFinal.length) {
            agregarAlLog("🏆 ¡Victoria! Has superado la élite del Jefe Final.", "crit");
            alert("¡TORNEO COMPLETADO CON ÉXITO! Has conquistado la Champions Arena.");
            document.getElementById("game-container").style.display = "none";
            document.getElementById("main-menu-screen").style.display = "flex";
        } else {
            agregarAlLog("Preparando el siguiente asalto del Jefe Final...", "system");
            setTimeout(() => iniciarProximaSala(), 1000);
        }
    } else {
        document.getElementById("cap-poke-img").src = rivalActual.sprite;
        document.getElementById("cap-poke-name").innerText = rivalActual.nombre;
        document.getElementById("cap-poke-type").innerText = rivalActual.tipo;
        
        document.getElementById("replace-list-container").style.display = "none";
        document.getElementById("capture-modal").style.display = "flex";
    }
}

function intentarAgregarAlEquipo() {
    // Al capturar, nos aseguramos de que el Pokémon tenga su vida completa y esté marcado como vivo
    const pokemonReclutado = { ...rivalActual, vivo: true, hp: rivalActual.hpMax };

    if (equipoJugador.length < 3) {
        equipoJugador.push(pokemonReclutado);
        agregarAlLog(`¡Has añadido a ${rivalActual.nombre.toUpperCase()} a tu equipo!`, "system");
        avanzarDeSala();
    } else {
        const contenedor = document.getElementById("replace-buttons-grid");
        contenedor.innerHTML = "";
        
        equipoJugador.forEach((poke, idx) => {
            const btn = document.createElement("button");
            btn.className = "btn-replace-opt";
            btn.onclick = () => reemplazarPokemon(idx, pokemonReclutado);
            btn.innerText = `Reemplazar a ${poke.nombre}`;
            contenedor.appendChild(btn);
        });

        document.getElementById("replace-list-container").style.display = "block";
    }
}

function reemplazarPokemon(idx, nuevoPokemon) {
    const abandonado = equipoJugador[idx].nombre;
    equipoJugador[idx] = nuevoPokemon;
    pokemonActivoIdx = idx; // Se despliega inmediatamente a pelear
    agregarAlLog(`Dejaste ir a ${abandonado.toUpperCase()} e ingresa ${nuevoPokemon.nombre.toUpperCase()}.`, "system");
    avanzarDeSala();
}

function dejarPokemonVencido() {
    agregarAlLog(`Decidiste no llevar a ${rivalActual.nombre.toUpperCase()}.`, "system");
    avanzarDeSala();
}

function avanzarDeSala() {
    document.getElementById("capture-modal").style.display = "none";
    salaActual++;
    setTimeout(() => iniciarProximaSala(), 600);
}

function actualizarDockEquipo() {
    const dock = document.getElementById("player-team-dock");
    dock.innerHTML = "";
    equipoJugador.forEach((poke) => {
        const img = document.createElement("img");
        img.className = "dock-ico";
        if (!poke.vivo) img.classList.add("fainted-member");
        img.src = poke.sprite;
        img.title = `${poke.nombre} (${poke.hp} HP)`;
        dock.appendChild(img);
    });
}

function agregarAlLog(txt, clase) {
    const logger = document.getElementById("battle-log");
    const p = document.createElement("p");
    p.className = `log-${clase}`;
    p.innerText = txt;
    logger.appendChild(p);
    logger.scrollTop = logger.scrollHeight;
}

// --- POKÉDEX MANTENIDA ---
function abrirModalPokedex() {
    document.getElementById("pokedex-modal").style.display = "flex";
    if(cachePokedex.length > 0) mostrarPokedexEnPantalla(cachePokedex);
}
function cerrarModalPokedex() { document.getElementById("pokedex-modal").style.display = "none"; }
async function precargarDatosPokedex() {
    try {
        const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151");
        const data = await res.json();
        cachePokedex = data.results.map((p, idx) => {
            const id = idx + 1;
            return { id: id, nombre: p.name, sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`, urlDetalle: p.url };
        });
    } catch(e) { console.error(e); }
}
function mostrarPokedexEnPantalla(lista) {
    const contenedor = document.getElementById("pokedex-list");
    contenedor.innerHTML = "";
    lista.forEach(poke => {
        const item = document.createElement("div");
        item.className = "pokedex-item";
        item.onclick = () => abrirCartaDesdeMenu(poke);
        item.innerHTML = `<span>N° ${String(poke.id).padStart(3, '0')}</span><img src="${poke.sprite}"><h4>${poke.nombre}</h4>`;
        contenedor.appendChild(item);
    });
}
async function abrirCartaDesdeMenu(pokemon) {
    const res = await fetch(pokemon.urlDetalle);
    const data = await res.json();
    const hp = data.stats[0].base_stat, atk = data.stats[1].base_stat, def = data.stats[2].base_stat, spd = data.stats[5].base_stat;
    document.getElementById("card-poke-id").innerText = `N° ${String(pokemon.id).padStart(3, '0')}`;
    document.getElementById("card-poke-type").innerText = data.types[0].type.name;
    document.getElementById("card-poke-name").innerText = pokemon.nombre;
    document.getElementById("card-poke-img").src = pokemon.sprite;
    document.getElementById("val-hp").innerText = hp;
    document.getElementById("val-atk").innerText = atk;
    document.getElementById("val-def").innerText = def;
    document.getElementById("val-spd").innerText = spd;
    document.getElementById("pokemon-card-overlay").style.display = "flex";
    setTimeout(() => {
        document.getElementById("bar-hp").style.width = `${Math.min(100, (hp/150)*100)}%`;
        document.getElementById("bar-atk").style.width = `${Math.min(100, (atk/150)*100)}%`;
        document.getElementById("bar-def").style.width = `${Math.min(100, (def/150)*100)}%`;
        document.getElementById("bar-spd").style.width = `${Math.min(100, (spd/150)*100)}%`;
    }, 50);
}
function cerrarCartaDigital() { document.getElementById("pokemon-card-overlay").style.display = "none"; }
function filtrarPokedex() {
    const txt = document.getElementById("pokedex-search-input").value.toLowerCase();
    const f = cachePokedex.filter(p => p.nombre.toLowerCase().includes(txt));
    mostrarPokedexEnPantalla(f);
}