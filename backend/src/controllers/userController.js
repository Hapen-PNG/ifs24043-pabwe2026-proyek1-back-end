export function getCurrentUser(req, res) {
  return res.json({
    status: 'success',
    data: { user: req.user },
  })
}
