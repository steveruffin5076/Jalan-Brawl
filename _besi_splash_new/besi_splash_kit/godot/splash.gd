extends Control
## Besi Works Studio splash screen (Godot 4.x).
## Plays the pixel-art sprite sheet with sound, then opens the main menu.
## Skippable with any key, mouse click or screen tap.

@export_file("*.tscn") var next_scene: String = "res://scenes/main_menu.tscn"

const SHEET := preload("res://besi_splash/besi_splash_sheet.png")
const SHEET_PORTRAIT := preload("res://besi_splash/besi_splash_sheet_portrait.png")
const SOUND := preload("res://besi_splash/besi_splash.ogg")
const COLUMNS := 6
const FRAMES := 36
const FPS := 12.0
const HOLD_SEC := 0.6
const FADE_SEC := 0.4
const BG := Color("#0c080a")

var _frame := 0
var _fw := 170
var _fh := 96
var _time := 0.0
var _playing := false
var _leaving := false
var _atlas := AtlasTexture.new()
var _view: TextureRect
var _audio: AudioStreamPlayer
var _tap_label: Label


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	var bg := ColorRect.new()
	bg.color = BG
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# Portrait screen (phone held upright) uses the 90x160 sheet.
	var vp := get_viewport_rect().size
	if vp.y > vp.x:
		_atlas.atlas = SHEET_PORTRAIT
		_fw = 96
		_fh = 170
	else:
		_atlas.atlas = SHEET
	_atlas.region = Rect2(0, 0, _fw, _fh)
	_view = TextureRect.new()
	_view.texture = _atlas
	_view.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	_view.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_view.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_view.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_view)

	_audio = AudioStreamPlayer.new()
	_audio.stream = SOUND
	add_child(_audio)

	# Browsers block sound until the player taps once, so web builds wait for a tap.
	if OS.has_feature("web"):
		_view.visible = false
		_tap_label = Label.new()
		_tap_label.text = "TAP TO START"
		_tap_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		_tap_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		_tap_label.set_anchors_preset(Control.PRESET_FULL_RECT)
		add_child(_tap_label)
	else:
		_start()


func _start() -> void:
	if _tap_label:
		_tap_label.queue_free()
		_tap_label = null
	_view.visible = true
	_playing = true
	_audio.play()


func _process(delta: float) -> void:
	if not _playing or _leaving:
		return
	_time += delta
	var f := int(_time * FPS)
	if f != _frame and f < FRAMES:
		_frame = f
		_atlas.region = Rect2((f % COLUMNS) * _fw, (f / COLUMNS) * _fh, _fw, _fh)
	if _time >= FRAMES / FPS + HOLD_SEC:
		_finish()


func _unhandled_input(event: InputEvent) -> void:
	var pressed := (event is InputEventKey and event.pressed) \
		or (event is InputEventMouseButton and event.pressed) \
		or (event is InputEventScreenTouch and event.pressed)
	if not pressed:
		return
	if not _playing:
		_start()
	else:
		_finish()


func _finish() -> void:
	if _leaving:
		return
	_leaving = true
	var tw := create_tween()
	tw.set_parallel(true)
	tw.tween_property(_view, "modulate:a", 0.0, FADE_SEC)
	tw.tween_property(_audio, "volume_db", -40.0, FADE_SEC)
	tw.chain().tween_callback(func(): get_tree().change_scene_to_file(next_scene))
