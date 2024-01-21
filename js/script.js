document.addEventListener("DOMContentLoaded", function () {
  const projectsList = document.getElementById("projects-list");

  fetch("/projects")
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(projectNames => {
      projectNames.forEach(projectName => {
        const projectContainer = document.createElement("div");
        projectContainer.classList.add("project-box");

        fetch(`/project/${projectName}/README.md`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
          })
          .then(description => {
            const sections = extractSections(description);

            const title = document.createElement("h2");
            title.textContent = projectName;
            projectContainer.appendChild(title);

            const tabsContainer = document.createElement("div");
            tabsContainer.classList.add("tabs-container");

            sections.forEach((section, index) => {
              const tab = document.createElement("div");
              tab.classList.add("tab");
              tab.textContent = section.title;
              tab.setAttribute("data-index", index);
              tab.onclick = function () {
                openTab(event, index);
              };

              tabsContainer.appendChild(tab);
            });

            projectContainer.appendChild(tabsContainer);

            sections.forEach((section, index) => {
              const contentContainer = document.createElement("div");
              contentContainer.classList.add("tab-content");
              contentContainer.setAttribute("data-index", index);

              const lines = section.content.split('\n');
              lines.forEach(line => {
                const trimmedLine = line.trim();

                if (trimmedLine.startsWith('- ')) {
                  contentContainer.style.textAlign = 'left';
                  const listItem = document.createElement("li");
                  listItem.innerHTML = processLine(trimmedLine.substring(2));
                  const ul = document.createElement("ul");
                  ul.appendChild(listItem);
                  contentContainer.appendChild(ul);
                } else if (trimmedLine.startsWith('> ')) {
                  contentContainer.style.textAlign = 'left';
                  const blockquote = document.createElement("blockquote");
                  blockquote.innerHTML = processLine(trimmedLine.substring(2));
                  contentContainer.appendChild(blockquote);
                } else if (trimmedLine.startsWith('[img "') && trimmedLine.endsWith('"]')) {
                  const imgSrc = trimmedLine.match(/\[img "([^"]+)"\]/)[1];
                  const imgElement = document.createElement("img");
                  imgElement.src = imgSrc;
                  imgElement.style.maxWidth = "100%"; // Set your preferred max width for images
                  contentContainer.appendChild(imgElement);
                } else if (trimmedLine.startsWith('[vid "') && trimmedLine.endsWith('"]')) {
                  const vidSrc = trimmedLine.match(/\[vid "([^"]+)"\]/)[1];
                  const vidElement = document.createElement("iframe");
                  vidElement.src = vidSrc;
                  vidElement.width = "100%"; // Set your preferred width for iframes
                  vidElement.height = "315"; // Set your preferred height for iframes
                  vidElement.style.maxWidth = "100%"; // Set your preferred max width for iframes
                  contentContainer.appendChild(vidElement);
                } else {
                  contentContainer.style.textAlign = 'center';
                  const paragraph = document.createElement("p");
                  paragraph.innerHTML = processLine(trimmedLine);
                  contentContainer.appendChild(paragraph);
                }
              });

              if (index !== 0) {
                contentContainer.style.display = 'none';
              }

              projectContainer.appendChild(contentContainer);
            });

            const downloadButton = document.createElement("a");
            downloadButton.classList.add("download-button");
            downloadButton.href = `/project/${projectName}/${projectName}.zip`;
            downloadButton.download = `${projectName}.zip`;
            downloadButton.textContent = "Download";
            projectContainer.appendChild(downloadButton);

            projectsList.appendChild(projectContainer);
          })
          .catch(error => console.error('Error fetching README.md:', error));
      });
    })
    .catch(error => console.error('Error fetching projects:', error));
});

function extractSections(description) {
  const sections = [];
  const lines = description.split('\n');
  let currentSection = { title: '', content: '' };

  lines.forEach(line => {
    if (line.startsWith('## ')) {
      if (currentSection.title) {
        sections.push({ ...currentSection });
      }
      currentSection.title = line.substring(3).trim();
      currentSection.content = '';
    } else {
      currentSection.content += line + '\n';
    }
  });

  if (currentSection.title) {
    sections.push({ ...currentSection });
  }

  return sections;
}

function openTab(event, index) {
  const selectedTab = event.target;
  const projectBox = selectedTab.closest('.project-box');

  if (!projectBox) {
    console.error('Error: Project box not found.');
    return;
  }

  const tabs = projectBox.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.classList.remove('active');
  });

  selectedTab.classList.add('active');

  const contentContainers = projectBox.querySelectorAll('.tab-content');
  contentContainers.forEach((contentContainer, i) => {
    contentContainer.style.display = i === index ? 'block' : 'none';
  });

  if (index >= contentContainers.length) {
    console.error(`Error: Content container with index ${index} not found.`);
  }
}

function processLine(line) {
  // Replace [b] with <b> and [/b] with </b> for making text bold
  return line.replace(/\[b\]/g, '<b>').replace(/\[\/b\]/g, '</b>').replace(/\bcopyright\b/gi, '©');
}
