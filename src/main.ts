import trainingMenu from "./menu.json";
import alarmSource from "./alarm.mp3?url";

const TITLE_CONTENTS = [
  "今日も頑張ろう～！",
  "やるだけで偉い！",
  "昨日よりも成長できる！",
  "今日もいってみよう！",
  "また来たの！　偉いね！",
  "お帰り！　最高じゃん！",
];

const GROUP_TEXTS: { [key: string]: string } = {
  abs: "腹筋",
  rest: "休憩",
};

const STORAGE_KEY = "muscle-vitae-results";

const AlarmAudio = new Audio(alarmSource);
AlarmAudio.loop = false;
AlarmAudio.volume = 0.5;
AlarmAudio.controls = false;
AlarmAudio.preload = "auto";

const convertDateTime = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  return `${y}/${m}/${d} ${hh}:${mm}`;
};

const updateResults = () => {
  const resultsContainer = document.getElementById("results");
  if (!resultsContainer) {
    console.warn("Results container not found.");
    return;
  }

  const results = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  resultsContainer.innerHTML = "";

  if (results.length === 0) return;

  results.forEach((result: { title: string; group: string; date: string }) => {
    const resultElement = document.createElement("div");
    resultElement.className = "result-item";

    const resultTitle = document.createElement("div");
    resultTitle.className = "result-title";
    resultTitle.textContent = result.title;
    const resultGroup = document.createElement("div");
    resultGroup.className = "result-group";
    resultGroup.textContent = GROUP_TEXTS[result.group] || result.group;
    const resultDate = document.createElement("div");
    resultDate.className = "result-date";
    resultDate.textContent = result.date;

    resultElement.appendChild(resultTitle);
    resultElement.appendChild(resultGroup);
    resultElement.appendChild(resultDate);

    resultsContainer.appendChild(resultElement);
  });
};

const commandFrameVideo = (command: string) => {
  const videoContainer = document.getElementById("video-container");
  if (!videoContainer) {
    console.warn("Video container not found.");
    return;
  }

  const videoIframe = videoContainer.querySelector<HTMLIFrameElement>("iframe");
  if (!videoIframe) {
    console.warn("Video iframe not found.");
    return;
  }

  const frameWindow = videoIframe.contentWindow;
  if (!frameWindow) {
    console.warn("Video iframe content window not found.");
    return;
  }
  if (frameWindow.postMessage) {
    frameWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: command,
        args: [],
      }),
      "*"
    );
    console.log(`Command "${command}" sent to video iframe.`);
  } else {
    console.warn("postMessage is not supported in this iframe.");
  }
};

const main = () => {
  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }

  document.querySelector<HTMLElement>("header")!.onclick = () => {
    console.log("Header clicked, reloading page...");
    location.reload();
  };

  const randomTitle =
    TITLE_CONTENTS[Math.floor(Math.random() * TITLE_CONTENTS.length)];
  const titleElement = document.getElementById("title-centering");

  if (titleElement) {
    titleElement.textContent = randomTitle;
  } else {
    console.warn("Title element not found.");
  }

  const menuSelector = document.getElementById(
    "muscle-select"
  ) as HTMLSelectElement;

  if (menuSelector) {
    for (let i = 0; i < trainingMenu.length; i++) {
      const muscle = trainingMenu[i];
      const option = document.createElement("option");
      option.value = i.toString();
      option.textContent = muscle.title;
      menuSelector.appendChild(option);
    }

    menuSelector.onchange = () => {
      const selectedMuscle = menuSelector.value;
      if (selectedMuscle === "" || selectedMuscle === null) {
        console.warn("No muscle selected.");
        return;
      }

      const selectedMuscleIndex = parseInt(selectedMuscle, 10);
      if (isNaN(selectedMuscleIndex)) {
        console.error("Invalid muscle index selected.");
        return;
      }

      const selectedMuscleData = trainingMenu[selectedMuscleIndex];
      if (!selectedMuscleData) {
        console.error("Selected muscle data not found.");
        return;
      }

      console.log(`Selected muscle data:`, selectedMuscleData);
      const startButton = document.getElementById(
        "start-button"
      ) as HTMLButtonElement;

      if (startButton) {
        startButton.disabled = false;

        const videoContainer = document.getElementById(
          "video-container"
        ) as HTMLDivElement;
        if (videoContainer) {
          videoContainer.innerHTML = ``;

          if (selectedMuscleData.url) {
            const videoIframe = document.createElement("iframe");
            videoIframe.src = selectedMuscleData.url;
            videoIframe.title = "YouTube video player";
            videoIframe.frameBorder = "0";
            videoIframe.allow =
              "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
            videoIframe.referrerPolicy = "strict-origin-when-cross-origin";
            videoIframe.allowFullscreen = true;
            videoContainer.appendChild(videoIframe);
          }
        }

        startButton.onclick = () => {
          console.log(
            `Starting training for: ${selectedMuscleData.title} for ${selectedMuscleData.time} seconds.`
          );
          AlarmAudio.pause();
          AlarmAudio.currentTime = 0;

          startButton.disabled = true;
          startButton.textContent = `終了！`;

          const startTime = new Date();
          commandFrameVideo("playVideo");

          const timerInterval = setInterval(() => {
            const elapsedTime = Math.floor(
              (new Date().getTime() - startTime.getTime()) / 1000
            );
            const remainingTime = selectedMuscleData.time - elapsedTime;
            document.getElementById(
              "title-centering"
            )!.textContent = `残り ${Math.floor(remainingTime / 60)}:${(
              remainingTime % 60
            )
              .toString()
              .padStart(2, "0")}`;
          }, 100);

          setTimeout(() => {
            AlarmAudio.play();
            clearInterval(timerInterval);

            startButton.onclick = () => {
              AlarmAudio.pause();
              AlarmAudio.currentTime = 0;

              console.log("Training ended.");
              document.getElementById("title-centering")!.textContent =
                "お疲れ様！";
              const results = JSON.parse(
                localStorage.getItem(STORAGE_KEY) || "[]"
              );
              results.push({
                title: selectedMuscleData.title,
                group: selectedMuscleData.group,
                date: convertDateTime(new Date()),
              });
              localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
              updateResults();
              startButton.textContent = "開始！";
            };
            startButton.disabled = false;
          }, selectedMuscleData.time * 1000);
        };
      } else {
        console.warn("Start button not found.");
      }
    };
  } else {
    console.warn("Muscle select element not found.");
  }

  updateResults();
  AlarmAudio.load();

  const exportButton = document.getElementById(
    "export-result"
  ) as HTMLButtonElement;
  if (exportButton) {
    exportButton.onclick = () => {
      alert(localStorage.getItem(STORAGE_KEY) || "No results found.");
    };
  }

  const importButton = document.getElementById(
    "import-result"
  ) as HTMLButtonElement;
  if (importButton) {
    importButton.onclick = () => {
      const input = prompt("結果を入力してください（JSON形式）:");
      if (input) {
        try {
          const parsedData = JSON.parse(input);
          if (Array.isArray(parsedData)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
            updateResults();
            alert("結果が更新されました。");
          } else {
            alert("無効なデータ形式です。配列形式で入力してください。");
          }
        } catch (error) {
          alert("JSONの解析に失敗しました。正しい形式で入力してください。");
        }
      }
    };
  }
};

document.addEventListener("DOMContentLoaded", main);
