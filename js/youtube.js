var player;
function onYouTubeIframeAPIReady() {
    // API готов
}

function playVideo(videoId) {
    const container = document.getElementById('video-container');
    container.classList.remove('hidden');

    if (player) {
        player.loadVideoById(videoId);
    } else {
        player = new YT.Player('player', {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                'autoplay': 1,
                'controls': 0,
                'modestbranding': 1
            },
            events: {
                'onStateChange': onPlayerStateChange
            }
        });
    }
}

function onPlayerStateChange(event) {
    // Если видео закончилось (код 0)
    if (event.data == YT.PlayerState.ENDED) {
        document.getElementById('video-container').classList.add('hidden');
    }
}

// Подгружаем скрипт API YouTube
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);