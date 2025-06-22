let t = {};

t.normalize = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
};

t.fade_out = {
  opacity: 0,
  scale: 0.97,
};

t.fade_out_forward = {
  opacity: 0,
  scale: 1.1,
};

t.fade_out_scale_1 = {
  opacity: 0,
};

t.fade_out_up = {
  opacity: 0,
  y: 200,
};

t.fade_out_top = {
  opacity: 0,
  scale: 0.98,
  y: 40,
};

t.fade_out_bottom = {
  opacity: 0,
  scale: 0.98,
  y: -40,
};

t.fade_out_minimize = {
  opacity: 0,
  scale: 0.5,
};

t.bob_left = {
  x: -20,
  opacity: 0.5,
};

t.bob_right = {
  x: 20,
  opacity: 0.5,
};

t.fade_out_left = {
  opacity: 0,
  x: -1000,
};

t.fade_out_right = {
  opacity: 0,
  x: 1000,
};

t.fade_out_left_minor = {
  opacity: 0,
  x: -300,
};

t.fade_out_right_minor = {
  opacity: 0,
  x: 300,
};

t.transition = {
  x: { duration: 0.33 },
  y: { duration: 0.33 },
  opacity: { duration: 0.25 },
  scale: { duration: 0.26 },
};

t.transition_fast = {
  x: { duration: 0.25 },
  y: { duration: 0.25 },
  opacity: { duration: 0.17 },
  scale: { duration: 0.18 },
};

export default t;
