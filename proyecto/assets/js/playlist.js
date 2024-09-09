document.addEventListener('DOMContentLoaded', async () => {
    const playlistsDiv = document.getElementById('playlists');
    const tracksDiv = document.getElementById('tracks');
    const playlistTitle = document.getElementById('playlistTitle');
    const audioPlayer = document.getElementById('audioPlayer');
    const volumeBar = document.getElementById('volumeBar');

    // Inicializar canciones
    let songs = [];
    let currentSongIndex = 0;
    let isPlaying = false;

    // Configurar el volumen inicial del reproductor
    audioPlayer.volume = volumeBar.value / 100;

    // Controlar el cambio de volumen
    volumeBar.addEventListener('input', function () {
        audioPlayer.volume = this.value / 100;
        console.log('Volumen ajustado a:', audioPlayer.volume);
    });

    const token = await APIController.getToken();

    // Aquí vamos a generar playlists basadas en géneros
    const genres = ['pop', 'rock', 'hip-hop']; // Ajusta los géneros según sea necesario

    genres.forEach(async genre => {
        const playlistData = await APIController.getPlaylistByGenre(token, genre);
        const albumImages = playlistData.albumImages; // Las imágenes de los álbumes
        const tracks = playlistData.tracks;
    
        const playlist = document.createElement('div');
        playlist.classList.add('col-md-4');
        playlist.id = `genre-${genre}`;
    
        // Aquí generamos el card con el collage de imágenes ya cargado
        playlist.innerHTML = `
            <div class="card mb-3" style="max-width: 540px;">
                <div class="row g-0">
                    <div class="col-md-4">
                        <div class="album-collage">
                            ${albumImages.map(img => `<img src="${img}" class="collage-img" />`).join('')}
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h5 class="card-title">Mix de ${genre}</h5>
                            <p class="card-text">Disfruta de una lista de reproducción personalizada con los mejores éxitos de ${genre}.</p>
                            <button class="btn btn-primary show-tracks" data-genre="${genre}">Ver canciones</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    
        playlistsDiv.appendChild(playlist);
    
        // Cuando se haga clic en el botón "Ver canciones"
        playlist.querySelector('.show-tracks').addEventListener('click', async () => {
            playlistTitle.textContent = `Playlist: ${genre}`;
            playlistTitle.style.display = 'block';
    
            // Limpiar los tracks anteriores
            tracksDiv.innerHTML = '';
    
            // Limpiar la lista global de canciones
            songs = [];
    
            // Mostrar las canciones en forma de lista
            tracks.forEach((track, index) => {
                if (track.preview_url) {
                    const songHTML = `
                        <div class="row mb-3 align-items-center">
                            <div class="col-auto">
                                <img src="${track.album.images[0].url}" class="song-img" alt="${track.name}">
                            </div>
                            <div class="col">
                                <h5 class="song-title mb-1">${track.name}</h5>
                                <p class="song-artist mb-0">${track.artists[0].name} - ${track.album.name}</p>
                                <button class="btn btn-success mt-2" onclick="playSelectedSongFromPlaylist(${songs.length})">
                                    Reproducir
                                </button>
                            </div>
                        </div>
                    `;
                    tracksDiv.innerHTML += songHTML;
    
                    // Agregar la canción a la lista global
                    songs.push({
                        name: track.name,
                        artist: track.artists[0].name,
                        album: track.album.name,
                        src: track.preview_url,
                        img: track.album.images[0].url
                    });
                }
            });
        });
    });

    // Función para reproducir la canción seleccionada desde una playlist
    window.playSelectedSongFromPlaylist = function(index) {
        if (songs[index]) {
            currentSongIndex = index; // Actualizar el índice de la canción actual
            playSong(); // Reproducir la canción seleccionada
        } else {
            console.error('Índice de canción fuera de rango:', index);
        }
    };

    // Función para reproducir la canción actual
    function playSong() {
        const selectedSong = songs[currentSongIndex]; // Obtener la canción actual
        audioPlayer.src = selectedSong.src; // Actualizar la fuente del reproductor
        audioPlayer.play(); // Reproducir la canción
        isPlaying = true;

        // Actualizar la interfaz del footer con la canción actual
        updateCurrentSongUI(selectedSong);

        document.getElementById('playPauseIcon').classList.remove('bi-play-fill');
        document.getElementById('playPauseIcon').classList.add('bi-pause-fill');
    }

    // Función para pausar la canción actual
    function pauseSong() {
        audioPlayer.pause();
        isPlaying = false;
        document.getElementById('playPauseIcon').classList.remove('bi-pause-fill');
        document.getElementById('playPauseIcon').classList.add('bi-play-fill');
    }

    // Control del botón de play/pause
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

    // Control de los botones de siguiente y anterior
    document.getElementById('nextBtn').addEventListener('click', playNextSong);
    document.getElementById('prevBtn').addEventListener('click', playPrevSong);

    // Función para actualizar la UI del footer con la canción actual
    function updateCurrentSongUI(song) {
        document.getElementById('current-song-title').textContent = song.name;
        document.getElementById('current-song-img').src = song.img;
    }

    // Control de la barra de progreso
    document.getElementById('progressBar').addEventListener('input', function () {
        const seekTime = (this.value / 100) * audioPlayer.duration;
        audioPlayer.currentTime = seekTime; // Ajustar la posición de la canción
    });

    // Actualizar la barra de progreso en tiempo real
    audioPlayer.addEventListener('timeupdate', function () {
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        document.getElementById('progressBar').value = progress; // Actualizar la barra de progreso
    });

    // --- Función para la búsqueda de canciones ---
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
