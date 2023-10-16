tinymce.init({
  selector: 'textarea#content-editor',
  placeholder: 'The journey start from here... ',
  plugins: [
    'image',
    'emoticons',
    'fullscreen',
    'wordcount',
    'autolink',
    'link',
  ],
});
//Post construct
let newPost = {
  title: '',
  content: '',
  summary: '',
  photo: '',
  author: document.getElementById('userID').innerText,
  category: '',
};
//Button Elements
// const btn = document.getElementById('btn-getvalue');
const btnSummary = document.getElementById('btn-summary');
const btnPreview = document.getElementById('btn-preview');

//Div Elements
const divImg = document.getElementById('div-image-upload');
//Image element
const imgElem = document.getElementById('img-upload');
//Progress bar
const progBar = document.querySelector('.progress');

//Form Image
const submitImageBtn = document.getElementById('btn-submit');

//Modal Preview
const modalPreview = new bootstrap.Modal('#modalPreview');

//Toast
const toastInfo = new bootstrap.Toast(document.querySelector('.toast'));
const toastMessage = document.getElementById('toast-message');

//-------------FUNCTION-------------//

const fillDataToModal = (postData) => {
  const title = document.getElementById('modal-preview-title');
  const photo = document.getElementById('modal-preview-photo');
  const divContent = document.getElementById('modal-preview-content');
  title.innerText = postData.title;
  photo.src = postData.photo;
  divContent.innerHTML = postData.content;
};

const getFile = () => {
  //Get user's file image
  const file = document.getElementById('formFile');
  file.addEventListener('change', () => {
    submitImageBtn.classList.remove('disabled');
  });

  return file.files[0];
};

const getPost = () => {
  newPost.title = document.getElementById('inp-title').value.trim();
  newPost.category = document.getElementById('select-category').value.trim();
  newPost.content = tinymce.get('content-editor').getContent();
  newPost.summary = document.getElementById('inp-summary').value.trim();
  newPost.photo = imgElem.src;
  if (document.getElementById('inp-location').value.trim().length > 0) {
    newPost.location = document.getElementById('inp-location').value.trim();
  }

  return newPost;
};

///Test button
// btn.addEventListener('click', (e) => {
//   toastMessage.innerText = 'Heheheh!'
//   toastInfo.show();
// });

const checkImage = (image) => {
  let result = true;
  if (!image || image.lengh === 0) {
    result = false;
  }
  return result;
};

const validatePost = (data) => {
  const validateFields = ['title', 'content', 'summary', 'photo'];
  validateFields.forEach((val) => {
    if (data[val] === '' || newPost[val] === undefined) {
      toastMessage.innerText = `${val} is required`;
      toastInfo.show();
      throw 'Missing some fields';
    }
  });
  return true;
};

getFile();
//-----------EVENT TRIGGER--------------//

//On upload Image
document.getElementById('formUpload').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData();
  //Get user's file image
  const file = getFile();
  if (!checkImage(file)) {
    toastMessage.innerText = 'Please choose image first';
    toastInfo.show();
    throw 'Image required';
  }
  formData.append('image', file);
  submitImageBtn.setAttribute('disabled', true);
  progBar.classList.remove('d-none');
  try {
    const response = await axios.post(
      '/api/v1/posts/upload',
      formData,
    );
    //- Response return: response.data.data.path
    console.log('Upload success!');
    newPost.photo = response.data.path;
    imgElem.setAttribute('src', response.data.data.path);
    divImg.classList.remove('d-none');
  } catch (error) {
    console.log('Error: ', error);
    console.log('Error: ', error.response?.data.message);

    submitImageBtn.removeAttribute('disabled');
  } finally {
    progBar.classList.add('d-none');
  }
});

//Summary input and button event
document.getElementById('inp-summary').addEventListener('keyup', function (e) {
  if (this.value.trim().length >= 1) {
    document.getElementById('btn-summary').setAttribute('disabled', true);
  } else {
    document.getElementById('btn-summary').removeAttribute('disabled');
  }
});

//Click button summary event
document.getElementById('btn-summary').addEventListener('click', async () => {
  const contentRaw = tinymce.get('content-editor').getContent();
  if (contentRaw.trim().length > 100) {
    document.getElementById('btn-summary').setAttribute('disabled', true);
    axios
      .post('/api/v1/posts/summarize', {
        text: contentRaw,
      })
      .then((res) => {
        const summary = res.data.data.summary;
        document.getElementById('inp-summary').value = summary;
      })
      .catch((err) => {
        console.log(err);
        toastMessage.innerText = "Something went wrong, please try again in a few minutes!";
        toastInfo.show();
      });
  }
});

//Preview event
document.getElementById('btn-preview').addEventListener('click', () => {
  const thisPost = getPost();
  validatePost(thisPost);
  fillDataToModal(thisPost);
  modalPreview.show();
  document.getElementById('modal-btn-submit').removeAttribute('disabled');
});

//Click submit modal
document.getElementById('modal-btn-submit').addEventListener('click', () => {
  validatePost(newPost);
  axios
    .post('/api/v1/posts', newPost)
    .then((res) => {
      console.log(res);
      modalPreview.hide();
      toastMessage.innerText = 'Đăng bài thành công!';
      toastInfo.show();
    })
    .catch((e) => {
      const message = e.response?.data.message;
      toastMessage.innerText = message;
      toastInfo.show();
      console.log(e);
    })
    .finally(
      document
        .getElementById('modal-btn-submit')
        .setAttribute('disabled', true),
    );
});
