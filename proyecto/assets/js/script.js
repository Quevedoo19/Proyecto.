// Variables globales
let songs = [];
let currentSongIndex = 0;
let isPlaying = false;

// Definir la cantidad mínima de canciones
const MIN_SONGS = 10;

// Función para esperar una cantidad de tiempo (usada para hacer las solicitudes con una pausa entre ellas)
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Verifica si spotifyService.js está cargado correctamente
document.addEventListener('DOMContentLoaded', async function () {
    try {
        console.log('Cargando la aplicación...');

        // Obtener el token de Spotify
        const token = await APIController.getToken();
        console.log('Token obtenido:', token);

        // Obtener los géneros disponibles
        const genres = await APIController.getGeneres(token);
        console.log('Géneros disponibles:', genres);

        // Seleccionamos algunos géneros al azar (aumenta el número de géneros si quieres más variedad)
        const selectedGenres = getRandomGenres(genres, 3); // Selecciona 3 géneros aleatorios
        console.log('Géneros seleccionados:', selectedGenres);

        // Obtener canciones de los géneros seleccionados
        for (const genre of selectedGenres) {
            console.log(`Obteniendo canciones para el género: ${genre}`);
            const { tracks } = await APIController.getPlaylistByGenre(token, genre);

            // Esperar 1 segundo antes de hacer la siguiente solicitud (para evitar el límite de la API)
            await delay(1000);

            // Filtrar canciones con `preview_url` disponible y agregarlas a la lista
            const genreSongs = tracks.filter(track => track.preview_url).map(track => ({
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                src: track.preview_url,
                img: track.album.images[0]?.url // Usar la imagen del álbum si está disponible
            }));

            // Agregar las canciones a la lista global de canciones
            songs = songs.concat(genreSongs);

            // Si ya tenemos suficientes canciones, salimos del bucle
            if (songs.length >= MIN_SONGS) break;
        }

        // Si hay menos de 10 canciones, mostrar un mensaje de error
        if (songs.length > 0) {
            console.log('Canciones seleccionadas para mostrar:', songs.slice(0, MIN_SONGS));
            generateSongList(songs.slice(0, MIN_SONGS)); // Mostrar las primeras 10 canciones
            console.log('Lista de canciones generada con éxito.');
        } else {
            console.log('No se encontraron suficientes canciones con preview_url.');
        }

    } catch (error) {
        console.error('Error al obtener las canciones desde Spotify:', error);
    }
});

// Función para seleccionar géneros aleatorios
function getRandomGenres(genres, numGenres) {
    const shuffled = genres.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numGenres);
}

// Función para generar la lista de canciones
function generateSongList(songs) {
    let songListContainer = document.getElementById('song-list');
    songListContainer.innerHTML = '';

    songs.forEach((song, index) => {
        let imgSrc = song.img ? song.img : 'ruta-a-imagen-predeterminada.jpg';  // Usa una imagen predeterminada si no hay imagen
        
        let songHTML = `
            <div class="col-md-3">
                <div class="song-card">
                    <div class="song-image">
                        <img src="${imgSrc}" class="card-img-top" alt="${song.name}">
                        <div class="play-button">
                            <button class="btn btn-success btn-circle" onclick="playSelectedSong(${index})">
                                <i class="bi bi-play-fill"></i>
                            </button>
                        </div>
                    </div>
                    <div class="song-info">
                        <h5 class="song-title">${song.name}</h5>
                        <p class="song-artist">${song.artist}</p>
                    </div>
                </div>
            </div>
        `;
        songListContainer.innerHTML += songHTML;
    });
}

// Función para reproducir la canción seleccionada
function playSelectedSong(index) {
    currentSongIndex = index; // Actualizar el índice de la canción actual
    playSong();
}

// Función para reproducir la canción actual
function playSong() {
    try {
        let selectedSong = songs[currentSongIndex]; // Obtener la canción actual
        let audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.src = selectedSong.src; // Actualizar la fuente del reproductor
        audioPlayer.play(); // Reproducir la canción
        isPlaying = true;

        // Actualizar el contenido en el footer con la canción actual
        updateCurrentSongUI(selectedSong);

        console.log('Reproduciendo la canción:', selectedSong.name);
        document.getElementById('playPauseIcon').classList.remove('bi-play-fill');
        document.getElementById('playPauseIcon').classList.add('bi-pause-fill');
    } catch (error) {
        console.error('Error al intentar reproducir la canción:', error);
    }
}

// Función para actualizar la UI del footer con la canción actual
function updateCurrentSongUI(song) {
    const titleElement = document.getElementById('current-song-title');

    // Actualizar el título de la canción
    titleElement.textContent = song.name;

    // Actualizar imagen del álbum
    document.getElementById('current-song-img').src = song.img;
}

// Función para pausar la canción actual
function pauseSong() {
    let audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.pause();
    isPlaying = false;
    document.getElementById('playPauseIcon').classList.remove('bi-pause-fill');
    document.getElementById('playPauseIcon').classList.add('bi-play-fill');
}

// Evento para el botón de play/pause
document.getElementById('playPauseBtn').addEventListener('click', function () {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});

// Función para reproducir la siguiente canción
function playNextSong() {
    if (currentSongIndex < songs.length - 1) {
        currentSongIndex++;
    } else {
        currentSongIndex = 0; // Vuelve al inicio si es la última canción
    }
    playSong();
}

// Función para reproducir la canción anterior
function playPrevSong() {
    if (currentSongIndex > 0) {
        currentSongIndex--;
    } else {
        currentSongIndex = songs.length - 1; // Ir a la última si es la primera canción
    }
    playSong();
}

// Eventos para los botones de siguiente y anterior
document.getElementById('nextBtn').addEventListener('click', playNextSong);
document.getElementById('prevBtn').addEventListener('click', playPrevSong);

// Control del volumen
document.getElementById('volumeBar').addEventListener('input', function () {
    let audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.volume = this.value / 100; // Ajustar el volumen del reproductor
    console.log('Volumen ajustado a:', this.value);
});

// Control de la barra de progreso
document.getElementById('progressBar').addEventListener('input', function () {
    let audioPlayer = document.getElementById('audioPlayer');
    let seekTime = (this.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = seekTime; // Ajustar la posición de la canción
});

// Actualizar la barra de progreso en tiempo real
let audioPlayer = document.getElementById('audioPlayer');
audioPlayer.addEventListener('timeupdate', function () {
    let progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    document.getElementById('progressBar').value = progress; // Actualizar la barra de progreso
});

// Escuchar el evento de submit del formulario de búsqueda
document.querySelector('form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevenir el comportamiento por defecto de recargar la página

    const query = document.getElementById('songSearchInput').value; // Obtener el valor del input de búsqueda
    if (query.trim() === "") {
        alert("Por favor, introduce un término de búsqueda.");
        return;
    }

    try {
        const token = await APIController.getToken(); // Obtener el token de autenticación
        const searchResults = await APIController.searchTracks(token, query); // Buscar canciones

        if (searchResults.length > 0) {
            console.log('Resultados de la búsqueda:', searchResults);
            generateSearchResults(searchResults); // Mostrar los resultados de la búsqueda en la UI
        } else {
            alert("No se encontraron canciones.");
        }
    } catch (error) {
        console.error('Error al buscar canciones:', error);
    }
});

// Función para generar y mostrar los resultados de búsqueda
function generateSearchResults(searchResults) {
    let songListContainer = document.getElementById('song-list');
    songListContainer.innerHTML = ''; // Limpiar la lista de canciones anterior

    // Mapear los resultados de búsqueda a la lista de canciones global
    songs = searchResults.map((song, index) => {
        let songHTML = `
            <div class="col-md-3">
                <div class="song-card">
                    <div class="song-image">
                        <img src="${song.album.images[0].url}" class="card-img-top" alt="${song.name}">
                        <div class="play-button">
                            <button class="btn btn-success btn-circle" onclick="playSelectedSong(${index})">
                                <i class="bi bi-play-fill"></i>
                            </button>
                        </div>
                    </div>
                    <div class="song-info">
                        <h5 class="song-title">${song.name}</h5>
                        <p class="song-artist">${song.artists[0].name}</p>
                    </div>
                </div>
            </div>
        `;
        songListContainer.innerHTML += songHTML;

        // Retornar el formato de la canción para la lista global
        return {
            name: song.name,
            artist: song.artists[0].name,
            album: song.album.name,
            src: song.preview_url, // Usar la URL de vista previa
            img: song.album.images[0].url
        };
    });
}
