const APIController = (function () {
  const clientId = "8132ed3f3ab6461fbebd5644104a38a0";
  const clientSecret = "f1a77c6b51f6419390824fc2a48522d5";

  const _getToken = async () => {
    try {
        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        if (!result.ok) {
            throw new Error(`Error al obtener el token: ${result.statusText}`);
        }

        const data = await result.json();
        console.log('Token obtenido:', data.access_token); // Verifica que se haya obtenido el token
        return data.access_token;
    } catch (error) {
        console.error('Error al obtener el token de acceso:', error);
    }
};


  const _getGeneres = async (token) => {
    const result = await fetch('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });

    const data = await result.json();
    return data.genres;
  }

  // Buscar canciones por nombre
  const _searchTracks = async (token, query) => {
    const result = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });

    const data = await result.json();
    return data.tracks.items;
  };

  const _getPlaylistByGenre = async (token, genre) => {
    try {
        const result = await fetch(`https://api.spotify.com/v1/recommendations?limit=10&seed_genres=${genre}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!result.ok) {
            throw new Error(`Error al obtener la playlist: ${result.statusText}`);
        }

        const data = await result.json();
        console.log(`Datos de la playlist obtenidos para el género ${genre}:`, data);  // Asegúrate de que los datos se están obteniendo

        return {
            tracks: data.tracks,
            albumImages: data.tracks.slice(0, 4).map(track => track.album.images[0]?.url || 'ruta-a-imagen-predeterminada.jpg')
        };
    } catch (error) {
        console.error(`Error al obtener playlist para el género ${genre}:`, error);
        return { tracks: [], albumImages: [] };
    }
};



  const _getTracks = async (token, tracks) => {
    const result = await fetch(`https://api.spotify.com/v1/tracks?ids=${tracks.join()}`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });

    const data = await result.json();
    return data.tracks;
  }

  const _getTrack = async (token, track) => {
    const result = await fetch(`https://api.spotify.com/v1/tracks/${track}`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });

    const data = await result.json();
    return data;
  }

  return {
    getToken() {
      return _getToken();
    },
    getGeneres(token) {
      return _getGeneres(token);
    },
    getPlaylistByGenre(token, genre) {
      return _getPlaylistByGenre(token, genre);
    },
    getTracks(token, tracks) {
      return _getTracks(token, tracks);
    },
    getTrack(token, track) {
      return _getTrack(token, track);
    },
    searchTracks(token, query) {
      return _searchTracks(token, query);
    }
  }


})();