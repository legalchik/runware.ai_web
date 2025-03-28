
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    size: params.get('size'),
    count: params.get('count'),
    colors: params.get('colors')?.split('-').filter(c => c) || [], // Фильтруем пустые значения
    bgColor: params.get('bgColor'),
    message_id: params.get('message_id')
  };
}

// InitUrlParams
function initFromUrlParams() {
  const { size, count, colors, bgColor, message_id } = getUrlParams();

  window.message_id = message_id

  // Устанавливаем aspectRatio
  if (size && !isNaN(size)) {
    const sizeValue = Math.min(Math.max(parseInt(size, 10), 0), 14);
    aspectSlider.value = sizeValue;
    updateAspect(sizeValue);
  }

  // Устанавливаем imageCount
  if (count && !isNaN(count)) {
    const countValue = Math.min(Math.max(parseInt(count, 10), 1), 4);
    imageSlider.value = countValue;
    imageLabel.textContent = countValue;
    [...imagePreview.children].forEach((div, index) => {
      div.classList.toggle('active', index < countValue);
    });
  }

  // Устанавливаем Colors
  if (colors.length > 0) {
    deleteColors();

    colors.forEach(color => {
      if (color && isValidHex(color)) {
        addColor(`#${color}`);
      }
    });
  }

  // Устанавливаем bgColor
  if (bgColor && isValidHex(bgColor)) {
    setBgColor(`#${bgColor}`);
  }
}

// Проверка HEX цвета (3 или 6 символов)
function isValidHex(color) {
  return /^([0-9A-F]{3}){1,2}$/i.test(color);
}

function rgbToHex(rgb) {
  if (!rgb) return null;

  // Если уже HEX - возвращаем без #
  if (rgb.startsWith('#')) {
    const hex = rgb.substring(1);
    return hex.length === 3 ? hex.replace(/(.)/g, '$1$1') : hex; // Преобразуем #ABC в AABBCC
  }

  // Если transparent
  if (rgb === 'transparent') return null;

  // Обработка RGB/RGBA
  const parts = rgb.match(/\d+/g);
  if (!parts || parts.length < 3) return null;

  return parts.slice(0, 3)
    .map(x => parseInt(x, 10).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

const aspectSlider = document.getElementById('aspect-slider');
const aspectLabel = document.getElementById('aspect-label');
const aspectInner = document.getElementById('aspect-inner');
const aspectRatios = ['2:1', '16:9', '10:6', '3:2', '14:10', '4:3', '5:4', '1:1', '4:5', '3:4', '10:14', '2:3', '6:10', '9:16', '1:2']

function updateAspect(value) {
  aspectLabel.textContent = aspectRatios[value];
  aspectLabel.value = value;
  const [w, h] = aspectRatios[value].split(':').map(Number);
  const maxSize = 30;
  const ratioW = w;
  const ratioH = h;
  let width = maxSize;
  let height = maxSize;

  if (ratioW > ratioH) {
    height = maxSize * (ratioH / ratioW);
  } else {
    width = maxSize * (ratioW / ratioH);
  }

  aspectInner.style.width = `${width}px`;
  aspectInner.style.height = `${height}px`;
}

const imageSlider = document.getElementById('image-slider');
const imageLabel = document.getElementById('image-count-label');
const imagePreview = document.getElementById('image-preview');

imageSlider.addEventListener('input', () => {
  const count = parseInt(imageSlider.value);
  imageLabel.textContent = count;
  [...imagePreview.children].forEach((div, index) => {
    div.classList.toggle('active', index < count);
  });
});

function addColor(value) {
  const container = document.getElementById('color-container');
  if (container.querySelectorAll('.circle:not(.border-dashed)').length >= 5) return; // max color count 5
  const colorDiv = document.createElement('div');
  colorDiv.className = 'circle relative';
  colorDiv.style.backgroundColor = value;

  const deleteBtn = document.createElement('span');
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerText = '×';
  deleteBtn.onclick = () => colorDiv.remove();

  colorDiv.appendChild(deleteBtn);
  container.insertBefore(colorDiv, container.lastElementChild);
}

function deleteColors(includeBg = false) {
  const container = document.getElementById('color-container');
  const plus = container.lastElementChild;
  container.innerHTML = '';
  container.appendChild(plus);
  if (includeBg) {
    document.getElementById('bgcolor-container').innerHTML = createAddBtn();
  }
}

function setBgColor(value) {
  const container = document.getElementById('bgcolor-container');
  container.innerHTML = '';

  const colorDiv = document.createElement('div');
  colorDiv.className = 'circle relative';
  colorDiv.style.backgroundColor = value;

  const deleteBtn = document.createElement('span');
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerText = '×';
  deleteBtn.onclick = () => container.innerHTML = createAddBtn();

  colorDiv.appendChild(deleteBtn);
  container.appendChild(colorDiv);
}

function createAddBtn() {
  return `
    <label class="circle border-2 border-dashed border-gray-400 flex items-center justify-center cursor-pointer">
      <span class="text-gray-400 text-xl">+</span>
      <input type="color" class="hidden" onchange="showColorConfirm(this, setBgColor)">
    </label>
  `;
}

function showColorConfirm(input, callback) {
  const color = input.value;
  callback(color);
}


document.addEventListener('DOMContentLoaded', () => {
  // Сначала обновляем значения по умолчанию
  updateAspect(aspectSlider.value);

  initFromUrlParams();

  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.MainButton.setText("Confirm").show();

  tg.MainButton.onClick(() => {
    const aspectRatio = aspectLabel.value;
    const imageCount = parseInt(imageLabel.textContent, 10);

    const colors = [...document.querySelectorAll('#color-container .circle')]
      .slice(0, -1) // Исключаем кнопку добавления
      .map(el => rgbToHex(getComputedStyle(el).backgroundColor))
      .filter(Boolean);

    const bgColorElem = document.querySelector('#bgcolor-container .circle');
    let bgColor = bgColorElem ? rgbToHex(getComputedStyle(bgColorElem).backgroundColor) : null;
    bgColor = bgColor === '000000' ? null : bgColor;

    // tg.sendData(JSON.stringify({
    //   aspectRatio,
    //   imageCount,
    //   ...(colors.length > 0 && { colors: colors.join('-') }),
    //   ...(bgColor && { bgColor })
    // }));

    // const settings = {
    //   aspectRatio,
    //   imageCount,
    //   ...(colors.length > 0 && { colors: colors.join('-') }),
    //   ...(bgColor && { bgColor })
    // };

    const params = [
      'gen',
      aspectRatio,
      imageCount,
      colors?.join('-') ?? '',
      bgColor
    ].join('_');

    console.log(params)

    const botUsername = 'icykcyber_bot'; // замените на username вашего бота
    const shareUrl = `https://t.me/${botUsername}?start=${params}`;

    // tg.CloudStorage.setItem('generation_settings', JSON.stringify(settings));
    tg.openTelegramLink(shareUrl);
    tg.close();
  });
});

aspectSlider.addEventListener('input', () => {
  updateAspect(aspectSlider.value);
});
