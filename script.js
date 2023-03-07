let slides = []
let artboardIndex = 0;
let scrollPosition = 0;
let currentAnimation = '';
let skipHighlight = false;

function ReverseAnimation(animation) {
    switch (animation) {
        case 'fromleft':
            return 'fromright';
        case 'fromright':
            return 'fromleft';
        case 'fromtop':
            return 'frombottom';
        case 'frombottom':
            return 'fromtop';
        default:
            return 'none';
    }
}

function getFrame(slide) {

}

function ResetAnimation(slide) {
    slide.firstElementChild.classList.remove('fromleft');
    slide.firstElementChild.classList.remove('fromright');
    slide.firstElementChild.classList.remove('fromtop');
    slide.firstElementChild.classList.remove('frombottom');

    slide.firstElementChild.classList.remove('toleft');
    slide.firstElementChild.classList.remove('toright');
    slide.firstElementChild.classList.remove('totop');
    slide.firstElementChild.classList.remove('tobottom');

    slide.firstElementChild.classList.remove('hide');
    slide.firstElementChild.classList.remove('restore');

    slide.classList.remove('hidden');
}

function ApplyAnimation(slide, animation, back) {
    if (back) {
        switch (animation) {
            case 'fromleft':
                slide.style.zIndex = 2;
                slide.firstElementChild.classList.add('toleft');
                break;
            case 'fromright':
                slide.style.zIndex = 2;
                slide.firstElementChild.classList.add('toright');
                break;
            case 'fromtop':
                slide.style.zIndex = 2;
                slide.firstElementChild.classList.add('totop');
                break;
            case 'frombottom':
                slide.style.zIndex = 2;
                slide.firstElementChild.classList.add('tobottom');
                break;
            default:
                slide.style.zIndex = 0;
                slide.classList.add('hidden');
                break;
        }
        return;
    }
    slide.style.zIndex = 1;
    switch (animation) {
        case 'fromleft':
            slide.firstElementChild.classList.add('fromleft');
            break;
        case 'fromright':
            slide.firstElementChild.classList.add('fromright');
            break;
        case 'fromtop':
            slide.firstElementChild.classList.add('fromtop');
            break;
        case 'frombottom':
            slide.firstElementChild.classList.add('frombottom');
            break;
        default:
            //slide.classList.add('restore');
            break;
    }
}

function PresentSlide(slide, animation, fast, isBack, maintainScrollPosition) {
    if (slide.classList.contains('visible')) {
        return;
    }
    ResetAnimation(slide);
    if (maintainScrollPosition) {
        slide.firstElementChild.firstElementChild.scrollTop = scrollPosition;
    }
    if (!fast) {
        if (isBack) {
            //slide.classList.add('restore');
        } else {
            currentAnimation = animation;
            ApplyAnimation(slide, animation, false);
        }
    }
    slide.style.zIndex = 1;
    slide.classList.add('visible');
    slide.classList.remove('hidden');
    const title = slide.getAttribute('name');
    document.title = title;
    document.getElementById("title").innerText = title
}

function HideSlide(slide, animation, fast, isBack) {
    if (fast || animation === "none") {
        ResetAnimation(slide);
    } else {
        if (!slide.classList.contains('visible')) {
            return;
        }
        ResetAnimation(slide);
        if (isBack) {
            ApplyAnimation(slide, currentAnimation, true);
        } else {
            slide.firstElementChild.classList.add('hide');
        }
    }

    slide.classList.add('hidden');
    slide.classList.remove('visible');
    slide.style.zIndex = "0";
}

function SelectFirstSlide(animation, fast, isBack) {
    for (let i = 0; i < slides.length; i++) {
        const artboard = document.querySelector('[artboard="' + slides[i] + '"]');
        if (i === 0) {
            PresentSlide(artboard, animation, fast, isBack, false);
        } else {
            HideSlide(artboard, animation, fast, isBack);
        }
    }
}

function SelectSlide(id, animation, fast, isBack, maintainScrollPosition) {
    if (id === undefined || id === null || id.length < 32) {
        if (id === "back") {
            window.history.back();
        } else {
            SelectFirstSlide(animation, fast, isBack);
        }
        return;
    }
    if (maintainScrollPosition) {
        const visibleScrolls = document.querySelectorAll(".slide.visible .slideScroll");
        scrollPosition = visibleScrolls.length > 0 ? visibleScrolls[0].scrollTop : 0;
    }
    for (let i = 0; i < slides.length; i++) {
        const artboard = document.querySelector('[artboard="' + slides[i] + '"]');
        if (slides[i] === id) {
            PresentSlide(artboard, animation, fast, isBack, maintainScrollPosition);
        } else {
            HideSlide(artboard, animation, fast, isBack);
        }
    }
}

function ShowSlide(id, animation, maintainScrollPosition) {
    skipHighlight = true;
    SelectSlide(id, animation, false, false, maintainScrollPosition);
    const url = new URL(`${location.origin}${location.pathname}?artboard=${id}&animation=${animation}`);
    history.pushState({"id": id, "animation": animation, "index": artboardIndex}, '', url);
    artboardIndex++;
}

function UpdateSlideSizes() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    for (let i = 0; i < slides.length; i++) {
        const slide = document.querySelector('[artboard="' + slides[i] + '"]');
        const width = parseInt(slide.style.width.replace('px', ''));
        const height = parseInt(slide.style.height.replace('px', ''));
        if (windowWidth > width &&
            windowHeight > height) {
            slide.style.transform = "scale(1,1)";
        } else {
            const scale = Math.min(windowWidth / width, windowHeight / height);
            slide.style.transform = "scale(" + scale + "," + scale + ")";
        }
    }
}

let hotspotTimeout;

function HighlightHotspots() {
    if (skipHighlight) {
        skipHighlight = false;
        return;
    }
    const hotspots = document.querySelectorAll(".slide.visible .hotspot");
    clearTimeout(hotspotTimeout)
    for (let i = 0; i < hotspots.length; i++) {
        hotspots[i].classList.add("highlight");
    }
    hotspotTimeout = setTimeout(function () {
        for (let i = 0; i < hotspots.length; i++) {
            hotspots[i].classList.remove("highlight");
        }
    }, 500);
}

window.onpopstate = function (event) {
    if (event.state == null) {
        SelectSlide(artboards[0], "fromback", false, false)
        return null;
    }
    const isBack = artboardIndex > event.state.index;
    artboardIndex = Number.isInteger(event.state.index) ? event.state.index : 0;
    SelectSlide(event.state.id, event.state.animation, false, isBack);
    currentAnimation = event.state.animation;
};

function ShowAlert(message) {
    const alert = document.getElementById("alert");
    const li = document.createElement("li")
    li.innerText = message;
    li.className = "alert";
    alert.appendChild(li)
    setTimeout(() => alert.removeChild(li), 5 * 1000)
}

let headerTimeout;

function HeaderState() {
    const header = document.getElementById("header");
    HideHeader(header)

    header.addEventListener("mouseenter", () => {
        clearTimeout(headerTimeout)
        header.style.opacity = '100%'
    })

    header.addEventListener("mouseleave", () => {
        HideHeader(header)
    })
}

function HideHeader(header) {
    headerTimeout = setTimeout(() => {
        header.style.opacity = '0%'
    }, 2000)
}

const createElementFromHTML = (htmlString) => {
    const div = document.createElement("div");
    div.innerHTML = htmlString;

    return div.children[0];
}

function AddArtboard(artboardData) {
    const artboards = document.getElementById("artboards")
    const artboard = createElementFromHTML(artboardData.html)

    artboards.appendChild(artboard)
    slides.push(artboardData.id)
}

function UpdateArtboard(artboardData) {
    const artboard = document.querySelector('[artboard="' + artboardData.id + '"]');
    if (artboard) {
        artboard.outerHTML = artboardData.html
        SelectSlide(artboardData.id, "fromback", false, false)
    } else {
        AddArtboard(artboardData)
    }
}

UpdateSlideSizes();
HeaderState()
window.addEventListener('resize', UpdateSlideSizes);
document.body.addEventListener("click", HighlightHotspots);