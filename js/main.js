// Инициализация ComfyJS
ComfyJS.onReward = (user, reward, cost, message, extra) => {
    // Замени "YouTubeRequest" на точное название твоей награды в Twitch
    if (reward === "YouTubeRequest") {
        const videoId = extractVideoId(message);
        if (videoId) {
            playVideo(videoId);
            document.getElementById('video-url').innerText = `Заказал: ${user}`;
        }
    }
};

function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Укажи название своего канала
ComfyJS.Init("ТВОЙ_КАНАЛ");