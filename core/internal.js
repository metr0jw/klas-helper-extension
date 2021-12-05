if (typeof browser === "undefined") {
  var browser = chrome;
}

// 태그에 삽입되지 않는 함수 목록
export const internalPathFunctions = {
  
	// 온라인 강의 화면
	'/spv/lis/lctre/viewer/LctreCntntsViewSpvPage.do': () => {
		// 온라인 강의 동영상 다운로드
		const downloadVideo = (videoCode) => {
      // CORS 허용을 위해 백그라운드로 관련 데이터를 보내고, 받아온 데이터로 렌더링을 진행합니다.
			browser.runtime.sendMessage({
					"action": "downloadVideo",
					"videoCode": videoCode
				}, function (response) {
          const oParser = new DOMParser();
          const documentXML  = oParser.parseFromString(response.xhr, "text/xml");
          const videoList = [];

          // 분할된 동영상 등 다양한 상황 처리
          if (documentXML.getElementsByTagName('desktop').length > 0) {
            videoList.push({
              url: documentXML.getElementsByTagName('media_uri')[0].innerHTML,
              type: documentXML.getElementsByTagName('content_type')[0].innerHTML
            });
          }
          else {
            const mediaURI = documentXML.getElementsByTagName('media_uri')[0].innerHTML;
            const videoNames = documentXML.getElementsByTagName('main_media');
            const videoTypes = documentXML.getElementsByTagName('story_type');

            for (let i = 0; i < videoNames.length; i++) {
              videoList.push({
                url: mediaURI.replace('[MEDIA_FILE]', videoNames[i].innerHTML),
                type: videoTypes[i].innerHTML
              });
            }
          }

          // 다운로드 버튼 렌더링
          for (let i = 0; i < videoList.length; i++) {
            const videoURL = videoList[i].url;
            const videoType = videoList[i].type === 'video1' ? '동영상' : '오디오';

            const labelElement = document.createElement('label');
            labelElement.innerHTML = `
              <a href="${videoURL}" target="_blank" style="background-color: brown; padding: 10px; text-decoration: none">
                <span style="color: white; font-weight: bold">${videoType} 받기 #${i + 1}</span>
              </a>
            `;
            document.querySelector('.mvtopba > label:last-of-type').after(labelElement);
          }
        }
      );
		};

		// 고유 번호를 받을 때까지 대기
		const waitTimer = setInterval(() => {
      const videoCode = document.querySelector("head > script:nth-child(8)").innerText.toString().split('https://kwcommons.kw.ac.kr/em/')[1].split('"')[0];
      document.body.setAttribute('data-video-code', videoCode);
			if (videoCode) {
				clearInterval(waitTimer);
				downloadVideo(videoCode);
			}
		}, 100);

		// 일정 시간이 지날 경우 타이머 해제
		setTimeout(() => {
			clearInterval(waitTimer);
		}, 10000);
	},

  // 메인 화면
  '/std/cmn/frame/Frame.do': () => {
		// 시간표 고정 렌더링
    const renderButton = () => {
      if (!document.getElementById('fix-timetable')) {
        const selectElement = document.querySelector('.scheduletitle > select')
        const buttonElement = document.createElement('button');
        buttonElement.addEventListener("click", setTimeTableIdx);
        buttonElement.innerHTML = `
          <div>시간표 고정</div>
        `;
        buttonElement.style.cssText = `
          position: absolute; left: 20px;
        `
        buttonElement.setAttribute('id', 'fix-timetable');
        buttonElement.setAttribute('class', 'btn2 btn-lightgreen');
        selectElement.before(buttonElement);
        
      }
    }
    const setTimeTableIdx = async () => {
      try {
        const selectElement = document.querySelector('.scheduletitle > select')
        const idx = selectElement.selectedIndex;
        await browser.storage.sync.set({"timeTableIdx": idx});
        alert(`시간표가 ${selectElement.options[idx].innerHTML}로 고정되었습니다.`);
        
      } catch (e) {
        alert("알 수 없는 오류가 발생했습니다.\n\n" + e);
      }
    }

    const changeTimeTable = () => {
      const element = document.getElementsByClassName("form-control")[0]
      try {
        browser.storage.sync.get(null, function(items) {
          if (items.timeTableIdx === undefined) {
            browser.storage.sync.set({"timeTableIdx": 0});
          }
          else {
            element.selectedIndex = items.timeTableIdx;
            element.dispatchEvent(new Event("change"));
          }
        });
      } catch (e) {
        ;
      }
    }
    changeTimeTable();
    setTimeout(() => {
      document.querySelector('.scheduletitle > select').addEventListener("change", renderButton);
    }, 100);
    
  }
};