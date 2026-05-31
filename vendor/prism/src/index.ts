// Prism — Browser Capability Bridge
// Maps virtual OS abstractions onto real browser capabilities.

// Adapter interfaces
export type {
  StorageAdapter, DisplayAdapter, InputAdapter,
  AudioAdapter, NetworkAdapter,
  Color, Rect, EventType, InputEvent
} from "./adapters.js";

// Storage
export { MemoryStorage } from "./storage/memory-storage.js";
export { LocalStorageAdapter, type StorageLike } from "./storage/local-storage.js";
export {
  type VfsSnapshot,
  createSnapshot, serializeSnapshot, deserializeSnapshot, extractFiles,
  saveVfsSnapshot, loadVfsSnapshot
} from "./storage/vfs-snapshot.js";

// Display
export { CanvasDisplay, type CanvasContext } from "./display/canvas-display.js";
export {
  SDL, type SDLWindow, type SDLRenderer,
  SDLSurface, SDLTexture, SDLMixChunk, SDLMixMusic,
  SDL_INIT_VIDEO, SDL_INIT_AUDIO, SDL_INIT_EVENTS, SDL_INIT_EVERYTHING,
  SDL_WINDOWPOS_CENTERED, SDL_WINDOW_SHOWN, SDL_RENDERER_ACCELERATED,
  SDL_QUIT, SDL_KEYDOWN, SDL_KEYUP,
  SDL_MOUSEMOTION, SDL_MOUSEBUTTONDOWN, SDL_MOUSEBUTTONUP
} from "./display/sdl.js";

// M.1 — Surface extensions
export {
  SDL_PIXELFORMAT_UNKNOWN, SDL_PIXELFORMAT_INDEX8, SDL_PIXELFORMAT_RGB332,
  SDL_PIXELFORMAT_RGB555, SDL_PIXELFORMAT_RGB565,
  SDL_PIXELFORMAT_RGB24, SDL_PIXELFORMAT_BGR24,
  SDL_PIXELFORMAT_RGB888, SDL_PIXELFORMAT_RGBX8888, SDL_PIXELFORMAT_BGR888,
  SDL_PIXELFORMAT_ARGB8888, SDL_PIXELFORMAT_RGBA8888,
  SDL_PIXELFORMAT_ABGR8888, SDL_PIXELFORMAT_BGRA8888,
  SDL_PIXELFORMAT_RGBA32, SDL_PIXELFORMAT_ARGB32,
  SDL_BLENDMODE_NONE, SDL_BLENDMODE_BLEND, SDL_BLENDMODE_ADD,
  SDL_BLENDMODE_MOD, SDL_BLENDMODE_MUL, SDL_BLENDMODE_INVALID,
  sdlBlendModeToCanvas,
  SDL_LockSurface, SDL_UnlockSurface, sdlSurfaceLockCount, SDL_MUSTLOCK,
  SDL_SetSurfaceBlendMode, SDL_GetSurfaceBlendMode,
  SDL_SetSurfaceAlphaMod, SDL_GetSurfaceAlphaMod,
  SDL_SetSurfaceColorMod, SDL_GetSurfaceColorMod,
  SDL_SetColorKey, SDL_GetColorKey,
  SDL_FillRect,
  pixelFormatBytesPerPixel, convertPixelToRGBA8888, mapRGBAToFormat,
  SDL_ConvertSurfaceFormat
} from "./display/surface-ext.js";

// M.5 — Canvas2D extensions
export {
  type Canvas2DExtContext, type ImageDataLike, type TextMetricsLike, type GradientLike,
  canvasArc, canvasBezierCurveTo, canvasQuadraticCurveTo, canvasArcTo, canvasEllipse,
  canvasSave, canvasRestore, canvasTranslate, canvasRotate, canvasScale,
  canvasSetTransform, canvasResetTransform,
  canvasGetImageData, canvasPutImageData, canvasCreateImageData, canvasDrawImage,
  canvasFillText, canvasStrokeText, canvasMeasureText, canvasSetFont,
  canvasCreateLinearGradient, canvasCreateRadialGradient, canvasCreatePattern,
  canvasSetFillStyle, canvasSetStrokeStyle
} from "./display/canvas2d-ext.js";

// Input
export {
  InputManager, domKeyToScancode,
  SCANCODE_A, SCANCODE_B, SCANCODE_C, SCANCODE_D,
  SCANCODE_W, SCANCODE_S, SCANCODE_SPACE, SCANCODE_RETURN, SCANCODE_ESCAPE,
  SCANCODE_LEFT, SCANCODE_RIGHT, SCANCODE_UP, SCANCODE_DOWN
} from "./input/input-manager.js";

// M.2 — SDL2 Events
export {
  type SDLEvent, type SDLEventListenerHandle, type DOMEventTargetLike,
  SDL_FIRSTEVENT, SDL_WINDOWEVENT, SDL_TEXTINPUT, SDL_MOUSEWHEEL,
  SDL_WINDOWEVENT_SHOWN, SDL_WINDOWEVENT_HIDDEN, SDL_WINDOWEVENT_EXPOSED,
  SDL_WINDOWEVENT_MOVED, SDL_WINDOWEVENT_RESIZED, SDL_WINDOWEVENT_SIZE_CHANGED,
  SDL_WINDOWEVENT_MINIMIZED, SDL_WINDOWEVENT_MAXIMIZED, SDL_WINDOWEVENT_RESTORED,
  SDL_WINDOWEVENT_FOCUS_GAINED, SDL_WINDOWEVENT_FOCUS_LOST, SDL_WINDOWEVENT_CLOSE,
  SDL_PushEvent, SDL_PollEvent, SDL_WaitEvent, SDL_WaitEventTimeout,
  SDL_FlushEvent, SDL_FlushEvents, SDL_HasEvent, SDL_HasEvents,
  sdlEventQueueLength, sdlEventQueueClear,
  drainInputToSDL, attachDOMEventListeners
} from "./input/sdl-events.js";

// Audio
export { AudioManager } from "./audio/audio-manager.js";

// M.6 — Web Audio
export {
  type AudioContextLike, type AudioParamLike, type GainNodeLike, type OscillatorNodeLike,
  type AudioBufferLike, type AudioBufferSourceNodeLike, type PannerNodeLike,
  createAudioContext, createOscillator, createGain, createBufferSource,
  createPanner, createBuffer, decodeAudioDataAsync, playBuffer,
  getSharedAudioContext, resetSharedAudioContext, playPcm
} from "./audio/web-audio.js";

// Network
export { NetworkStub } from "./network/network-stub.js";

// M.7 — Fetch / WebSocket
export {
  FetchNetworkAdapter, openWebSocket,
  type WSClient, type WebSocketLike
} from "./network/http-client.js";

// SDL_image (SDL2_image)
export {
  IMG_INIT_JPG, IMG_INIT_PNG, IMG_INIT_TIF, IMG_INIT_WEBP, IMG_INIT_JXL, IMG_INIT_AVIF,
  IMG_Init, IMG_Quit, IMG_Load, IMG_Load_RW, IMG_LoadTexture, IMG_LoadTexture_RW,
  IMG_SavePNG, IMG_SaveJPG, IMG_GetError, IMG_SetError,
  IMG_isPNG, IMG_isJPG, IMG_isBMP, IMG_isGIF, IMG_isTIF, IMG_isWEBP,
  SDL_RWFromFile, SDL_RWFromMem, setImageDecoder,
  type SDLRWops, type ImageDecoder
} from "./display/sdl-image.js";

// SDL2 renderer draw API (module-level)
export {
  SDL_RENDERER_SOFTWARE, SDL_RENDERER_PRESENTVSYNC, SDL_RENDERER_TARGETTEXTURE,
  SDL_FLIP_NONE, SDL_FLIP_HORIZONTAL, SDL_FLIP_VERTICAL,
  type SDLPoint, type SDLRect, type SDLRenderer2, type SDLRenderCommand,
  SDL_CreateRenderer, SDL_DestroyRenderer,
  SDL_SetRenderDrawColor, SDL_GetRenderDrawColor,
  SDL_RenderClear,
  SDL_RenderDrawPoint, SDL_RenderDrawPoints,
  SDL_RenderDrawLine, SDL_RenderDrawLines,
  SDL_RenderDrawRect, SDL_RenderDrawRects,
  SDL_RenderFillRect, SDL_RenderFillRects,
  SDL_RenderCopy, SDL_RenderCopyEx,
  SDL_RenderPresent,
  SDL_SetRenderTarget, SDL_GetRenderTarget,
  SDL_RenderReadPixels,
  SDL_RenderSetViewport, SDL_RenderGetViewport,
  SDL_RenderSetClipRect, SDL_RenderGetClipRect,
  SDL_CreateTexture, SDL_CreateTextureFromSurface, SDL_DestroyTexture
} from "./display/sdl-renderer.js";

// SDL2 input + timing (module-level)
export {
  SDL_GetKeyboardState, SDL_GetMouseState,
  SDL_GetTicks, SDL_GetTicks64, SDL_Delay,
  SDL_GetPerformanceCounter, SDL_GetPerformanceFrequency,
  setSDLInputSource, feedSDLInputEvent, resetSDLInputState
} from "./input/sdl-input.js";

// WebGL 1.0 context scaffold (Khronos WebGL 1.0 spec)
export {
  createWebGLContext,
  type WebGLContextStub, type WebGLCommand, type CreateWebGLContextOptions,
  type WebGLShaderStub, type WebGLProgramStub, type WebGLBufferStub,
  type WebGLTextureStub, type WebGLUniformLocationStub, type CanvasLike,
  GL_DEPTH_BUFFER_BIT, GL_COLOR_BUFFER_BIT,
  GL_POINTS, GL_LINES, GL_TRIANGLES,
  GL_ARRAY_BUFFER, GL_ELEMENT_ARRAY_BUFFER, GL_STATIC_DRAW,
  GL_FLOAT, GL_UNSIGNED_SHORT, GL_UNSIGNED_BYTE,
  GL_FRAGMENT_SHADER, GL_VERTEX_SHADER,
  GL_COMPILE_STATUS, GL_LINK_STATUS,
  GL_TEXTURE_2D, GL_RGBA
} from "./display/webgl.js";

// SDL2_mixer extended coverage
export {
  type Mix_Chunk, type Mix_Music, type MixerCommand,
  MIX_DEFAULT_FREQUENCY, MIX_DEFAULT_CHANNELS,
  MIX_DEFAULT_FORMAT, AUDIO_S16SYS, MIX_CHANNEL_POST,
  Mix_OpenAudioDevice, Mix_VolumeChunk,
  Mix_SetPanning, Mix_SetPosition,
  Mix_AllocateChannels, Mix_ChannelFinished,
  // Re-exported core entry points (so consumers can import all Mix_* from one place).
  Mix_OpenAudio as MixerOpenAudio,
  Mix_CloseAudio as MixerCloseAudio,
  Mix_LoadWAV as MixerLoadWAV,
  Mix_LoadMUS as MixerLoadMUS,
  Mix_PlayChannel as MixerPlayChannel,
  Mix_PlayMusic as MixerPlayMusic,
  Mix_Volume as MixerVolume,
  Mix_VolumeMusic as MixerVolumeMusic,
  Mix_HaltChannel as MixerHaltChannel,
  Mix_HaltMusic as MixerHaltMusic,
  Mix_Pause as MixerPause,
  Mix_Resume as MixerResume,
  Mix_Paused as MixerPaused,
  Mix_Playing as MixerPlaying,
  Mix_PlayingMusic as MixerPlayingMusic,
  Mix_FreeChunk as MixerFreeChunk,
  Mix_FreeMusic as MixerFreeMusic
} from "./audio/sdl-mixer.js";

// Bridge facade
export { PrismBridge, type PrismConfig } from "./bridge.js";
