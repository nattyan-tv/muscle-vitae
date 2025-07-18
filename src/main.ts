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
  chest: "胸筋",
  back: "背筋",
  legs: "脚",
  arms: "腕",
  shoulders: "肩",
  cardio: "有酸素",
  core: "体幹",
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

const formatCumulativeTime = (totalSeconds: number): HTMLDivElement => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  let timeStr = "";
  if (hours > 0) {
    timeStr += `${hours}時間`;
  }
  if (minutes > 0) {
    timeStr += `${minutes}分`;
  }
  if (seconds > 0 || timeStr === "") {
    timeStr += `${seconds}秒間`;
  }
  
  const encouragements = [
    "これまでよく頑張ったね！",
    "すごい努力だよ！",
    "継続は力なり！",
    "トレーニング積み重ねが素晴らしい！",
    "この調子で頑張ろう！",
  ];
  
  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
  
  // Create the container element
  const container = document.createElement("div");
  
  // Create and append the title element
  const titleElement = document.createElement("div");
  titleElement.className = "cumulative-title";
  titleElement.textContent = "累計トレーニング時間";
  container.appendChild(titleElement);
  
  // Create and append the time value element
  const timeValueElement = document.createElement("div");
  timeValueElement.className = "cumulative-time-value";
  timeValueElement.textContent = timeStr;
  container.appendChild(timeValueElement);
  
  // Create and append the message element
  const messageElement = document.createElement("div");
  messageElement.className = "cumulative-message";
  messageElement.textContent = randomEncouragement;
  container.appendChild(messageElement);
  
  return container;
};

const updateResults = () => {
  const resultsContainer = document.getElementById("results");
  if (!resultsContainer) {
    console.warn("Results container not found.");
    return;
  }

  const results = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  
  // Migrate old data format to include elapse field
  let needsMigration = false;
  results.forEach((result: any) => {
    if (!result.hasOwnProperty('elapse')) {
      needsMigration = true;
      // For old data, we don't know the actual elapsed time, so set to 0
      result.elapse = 0;
    }
  });
  
  if (needsMigration) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  }
  
  resultsContainer.innerHTML = "";

  if (results.length === 0) return;

  // Calculate total elapsed time
  const totalElapsed = results.reduce((sum: number, result: any) => sum + (result.elapse || 0), 0);
  
  results.forEach((result: { title: string; group: string; date: string; elapse?: number }) => {
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
  
  // Add cumulative time display
  if (totalElapsed > 0) {
    const cumulativeElement = document.createElement("div");
    cumulativeElement.className = "cumulative-time";
    const cumulativeTimeDisplay = formatCumulativeTime(totalElapsed);
    cumulativeElement.appendChild(cumulativeTimeDisplay);
    resultsContainer.appendChild(cumulativeElement);
  }
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

const handleCustomTrainingSelection = (startButton: HTMLButtonElement, videoContainer: HTMLDivElement) => {
  startButton.disabled = false;
  
  // Create custom training UI using DOM elements
  const customForm = document.createElement("div");
  customForm.className = "custom-training-form";
  
  // Create name input group
  const nameInputGroup = document.createElement("div");
  nameInputGroup.className = "custom-input-group";
  
  const nameLabel = document.createElement("label");
  nameLabel.setAttribute("for", "custom-name");
  nameLabel.textContent = "メニュー名:";
  nameInputGroup.appendChild(nameLabel);
  
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.id = "custom-name";
  nameInput.placeholder = "例: 腕立て伏せ";
  nameInputGroup.appendChild(nameInput);
  
  customForm.appendChild(nameInputGroup);
  
  // Create type selection group
  const typeInputGroup = document.createElement("div");
  typeInputGroup.className = "custom-input-group";
  
  const typeLabel = document.createElement("label");
  typeLabel.setAttribute("for", "custom-type");
  typeLabel.textContent = "種類:";
  typeInputGroup.appendChild(typeLabel);
  
  const typeSelect = document.createElement("select");
  typeSelect.id = "custom-type";
  
  // Add options to the select
  Object.entries(GROUP_TEXTS).forEach(([key, value]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = value;
    typeSelect.appendChild(option);
  });
  
  typeInputGroup.appendChild(typeSelect);
  customForm.appendChild(typeInputGroup);
  
  // Clear and append the form to video container
  videoContainer.innerHTML = "";
  videoContainer.appendChild(customForm);
  
  startButton.onclick = () => {
    const nameInput = document.getElementById("custom-name") as HTMLInputElement;
    const typeSelect = document.getElementById("custom-type") as HTMLSelectElement;
    
    const customName = nameInput.value.trim();
    const customType = typeSelect.value;
    
    if (!customName) {
      alert("メニュー名を入力してください");
      return;
    }
    
    console.log(`Starting custom training: ${customName} (${customType})`);
    
    startButton.disabled = true;
    startButton.textContent = "終了！";
    
    const startTime = new Date();
    let timerInterval: number;
    
    // Count up timer for custom training
    timerInterval = setInterval(() => {
      const elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      const minutes = Math.floor(elapsedTime / 60);
      const seconds = elapsedTime % 60;
      document.getElementById("title-centering")!.textContent = 
        `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }, 100);
    
    startButton.onclick = () => {
      clearInterval(timerInterval);
      const elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      
      console.log("Custom training ended.");
      document.getElementById("title-centering")!.textContent = "お疲れ様！";
      
      const results = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      results.push({
        title: `${customName} (カスタムメニュー)`,
        group: customType,
        date: convertDateTime(new Date()),
        elapse: elapsedTime,
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
      updateResults();
      startButton.textContent = "開始！";
      startButton.disabled = false;
    };
    
    // Enable the button so user can stop the training
    startButton.disabled = false;
  };
};

const handleRegularTrainingSelection = (selectedMuscleData: any, startButton: HTMLButtonElement, videoContainer: HTMLDivElement) => {
  console.log(`Selected muscle data:`, selectedMuscleData);
  
  if (startButton) {
    startButton.disabled = false;

    if (videoContainer) {
      videoContainer.innerHTML = "";

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
            elapse: selectedMuscleData.time,
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
    
    // Add custom training option
    const customOption = document.createElement("option");
    customOption.value = "custom";
    customOption.textContent = "カスタムトレーニング";
    menuSelector.appendChild(customOption);

    menuSelector.onchange = () => {
      const selectedMuscle = menuSelector.value;
      if (selectedMuscle === "" || selectedMuscle === null) {
        console.warn("No muscle selected.");
        return;
      }

      const startButton = document.getElementById("start-button") as HTMLButtonElement;
      const videoContainer = document.getElementById("video-container") as HTMLDivElement;
      
      if (selectedMuscle === "custom") {
        // Handle custom training selection
        handleCustomTrainingSelection(startButton, videoContainer);
      } else {
        // Handle regular training selection
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

        handleRegularTrainingSelection(selectedMuscleData, startButton, videoContainer);
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
