const formLogin = document.getElementsByTagName('form')[0];
formLogin.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.querySelector('#email').value;
  const password = document.querySelector('#password').value;

  login(email, password);
});

const login = async (email, password) => {
  try {
    const res = await axios.post('/api/v1/users/login', {
      email,
      password,
    });
    if (res.data.status === 'success') {
      document.getElementById('textModal').innerText =
        'Login successfully, directing to home page...';
      new bootstrap.Modal(document.getElementById('modalLoginStatus')).show();
      window.setInterval(() => {
        window.location.href='/'
      }, 2000);
    }
  } catch (error) {
    document.getElementById('textModal').innerText = error.response.data.message;
    new bootstrap.Modal(document.getElementById('modalLoginStatus')).show();
  }
};
