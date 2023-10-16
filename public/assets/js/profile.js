const toastInfo = new bootstrap.Toast(document.querySelector('.toast'));
const toastMessage = document.getElementById('toast-message');

const formUser = document.getElementById('user-info');
const formPassword = document.getElementById('password-info');

const formImageUpload = document.getElementById('form-avatar');
const userPhotoSrc = document.getElementById('userPhoto');
const inputPhoto = document.getElementById('inp-photo');
const btnUploadImage = document.getElementById('btnUserPhoto');
//Functions
const updateSettings = (data, type) => {
  const url =
    type === 'password' ? '/api/v1/users/changepass' : '/api/v1/users/updateme';
  axios
    .patch(url, data)
    .then((result) => {
      toastMessage.innerText = 'Updated successfully!';
      toastInfo.show();
    })
    .catch((error) => {
      toastMessage.innerText =
        error.response?.data?.message ||
        'Something went wrong, please try again in a few minutes!';
      toastInfo.show();
    });
};

const getInputData = () => {
  const name = document.getElementById('inputName').value;
  const email = document.getElementById('inputEmail').value;
  // const photo = userPhotoSrc.src;
  // if (photo.match(/(127.0.0.1)|(localhost)/g)) {
  //   return { name, email };
  // }
  return { name, email };
};
const getPassword = () => {
  const passwordCurrent = document.getElementById('inputPasswordCurrent').value;
  const password = document.getElementById('inputPassword').value;
  const passwordConfirm = document.getElementById('inputPasswordConfirm').value;
  return { passwordCurrent, password, passwordConfirm };
};
const validateData = (objectData, type) => {
  // const validateFields = ['name', 'email'];
  const validFields =
    type === 'password'
      ? ['passwordCurrent', 'password', 'passwordConfirm']
      : ['name', 'email'];
  validFields.forEach((e) => {
    if (!objectData[e]) {
      toastMessage.innerText = `${e} cannot be empty`;
      toastInfo.show();
      throw `${e} cannot be empty`;
    }
  });
  return true;
};

//- Events
if (formUser)
  formUser.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = getInputData();
    if (validateData(data)) {
      updateSettings(data);
    }
  });

if (formPassword)
  formPassword.addEventListener('submit', (e) => {
    e.preventDefault();
    const passwordData = getPassword();
    console.log(passwordData);
    if (validateData(passwordData, 'password')) {
      updateSettings(passwordData, 'password');
    }
  });

if (formImageUpload)
  formImageUpload.addEventListener('submit', (e) => {
    console.log('Clicked!');
    e.preventDefault();
    const file = inputPhoto.files[0];
    if (!file) {
      toastMessage.innerText = 'Please choose image first!';
      toastInfo.show();
      throw 'No file selected';
    }
    const data = new FormData();
    data.append('image', file);
    axios
      .post('/api/v1/users/photo', data)
      .then((res) => {
        console.log(res);
        const imgUrl = res.data.data.path;
        userPhotoSrc.src = imgUrl;
        axios
          .patch('/api/v1/users/updateme', { photo: imgUrl })
          .then((res) => {
            console.log(res);
            toastMessage.innerText = 'Your profile image has been updated';
            toastInfo.show();
          })
          .catch((error) => {
            console.log(error);
          });
      })
      .catch((error) => {
        toastMessage.innerText =
          error.response?.data?.message || 'Something went wrong';
        toastInfo.show();
      })
      .finally(() => {
        btnUploadImage.setAttribute('disabled', true);
      });
  });
