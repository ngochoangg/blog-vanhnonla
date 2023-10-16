const btnLogout = document.getElementById('btnLogout');
btnLogout?.addEventListener('click', async (e) => {
  console.log(document.cookie.length);
  const res = await axios({
    method: 'get',
    url: '/api/v1/users/logout',
  });
  console.log(res);
  setInterval(() => {
    window.location.pathname = '/';
  }, 1000);
});
