const albumBucketName = `jos-testpictures`;
const bucketRegion = `ap-southeast-1`;
const IdentityPoolId = `ap-southeast-1:346bc1d9-52a3-4912-a8cc-167ec3d46605`;

AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
});

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: {Bucket: albumBucketName}
});

function listAlbums() {
  // get list of album object
  // get length of album object, then, for each, create <div id=albumEntry${index}></div> within 
  // for each of album object, get 1 photo within that album object (max keys 1)
  // then, modify 
  // close callback for calling the list of photo
  // close callback for calling the list of albums
  s3.listObjectsV2({Delimiter: '/'}, function(err, albumList) {
    if (err) {
      document.getElementById('app').innerHTML = getHtml('<p>There was an error listing your albums. Check console for details.</p>');;
      console.log("Error: " + err)
    } else {
      const message = albumList.CommonPrefixes.length ? '<p>Click on an album name or image preview to view it.</p>' : '<p>You do not have any albums. Please create album.</p>'
      let htmlTemplate = [getHtml([
        '<h2>Albums</h2>',
        message,
        '<table style="width: 100%">',
          '<tr>',
            '<th>Album title</th>',
            '<th style="width: 256px">Album preview</th>',
            '<th style="width: 256px">',
              '<button onclick="createAlbum(prompt(\'Enter Album Name:\'))">',
                'Create New Album',
              '</button>',
            '</th>',
          '</tr>'
      ])];  // the start of the table
      let albumDiv = [];
      albumList.CommonPrefixes.forEach((albumEP, index) => {
        const albumName = decodeURIComponent(albumEP.Prefix.replace('/', ''));
        albumDiv[index] = document.createElement("div")
        albumDiv[index].id = "album" + index;
        document.getElementById('app').appendChild(albumDiv[index])
        htmlTemplate.push(getHtml([
          '<tr>',
            '<td>',
              '<span onclick="viewAlbum(\'' + albumName + '\')"><b>',
                albumName,
              '</b></span>',
            '</td>',
            '<td>',
              '<span onclick="viewAlbum(\'' + albumName + '\')">',
                albumDiv[index].outerHTML,
              '</span>',
            '</td>',
            '<td>',,
              '<button onclick="deleteAlbum(\'' + albumName + '\')">',
                'Delete this album',
            '</button>',
            '</td>',
          '</tr>'
        ]));
      })
      htmlTemplate.push('</table>');
      document.getElementById('app').innerHTML = getHtml(htmlTemplate);
      albumList.CommonPrefixes.forEach((albumEP, index) => {
        const albumName = decodeURIComponent(albumEP.Prefix.replace('/', ''));
        s3.listObjectsV2({Prefix: encodeURIComponent(albumName) + '//', MaxKeys: 1}, (err, photo) => {
          const middle = (err || !photo.Contents.length) ? '<p>Picture not found or unavailable.</p>' : `<img src="${this.request.httpRequest.endpoint.href + albumBucketName + '/' + encodeURIComponent(photo.Contents[0].Key)}" style="width:128px;height:128px;display:block;margin-left:auto;margin-right:auto">`;
          // console.log(middle)
          document.getElementById("album" + index).innerHTML = middle;
          // document.getElementById(`'album${index}`).innerHTML = middle;
        });
      })
    }
  });
}

function createAlbum(albumName) {
  albumName = albumName.trim();
  if (!albumName) {
    return alert('Album names must contain at least one non-space character.');
  }
  if (albumName.indexOf('/') !== -1) {
    return alert('Album names cannot contain slashes.');
  }
  var albumKey = encodeURIComponent(albumName) + '/';
  s3.headObject({Key: albumKey}, function(err, data) {
    if (!err) {
      return alert('Album already exists.');
    }
    if (err.code !== 'NotFound') {
      return alert('There was an error accessing the database: ' + err.message);
    }
    s3.putObject({Key: albumKey}, function(err, data) {
      if (err) {
        return alert('There was an error creating your album: ' + err.message);
      }
      alert('Successfully created album.');
      viewAlbum(albumName);
    });
  });
}

function viewAlbum(albumName) {
  var albumPhotosKey = encodeURIComponent(albumName) + '//';
  s3.listObjects({Prefix: albumPhotosKey}, function(err, data) {
    if (err) {
      return alert('There was an error viewing your album: ' + err.message);
    }
    // `this` references the AWS.Response instance that represents the response
    var href = this.request.httpRequest.endpoint.href;
    var bucketUrl = href + albumBucketName + '/';

    var photos = data.Contents.map(function(photo) {
      var photoKey = photo.Key;
      var photoUrl = bucketUrl + encodeURIComponent(photoKey);
      return getHtml([
        '<span>',
          '<div>',
            '<img style="width:128px;height:128px;" src="' + photoUrl + '"/>',
          '</div>',
          '<div>',
            '<span onclick="deletePhoto(\'' + albumName + "','" + photoKey + '\')">',
              'X',
            '</span>',
            '<span>',
              photoKey.replace(albumPhotosKey, ''),
            '</span>',
          '</div>',
        '<span>',
      ]);
    });
    var message = photos.length ?
      '<p>Click on the X to delete the photo</p>' :
      '<p>You do not have any photos in this album. Please add photos.</p>';
    var htmlTemplate = [
      '<h2>',
        'Album: ' + albumName,
      '</h2>',
      message,
      '<div>',
        getHtml(photos),
      '</div>',
      '<input id="photoupload" type="file" accept="image/*">',
      '<button id="addphoto" onclick="addPhoto(\'' + albumName +'\')">',
        'Add Photo',
      '</button>',
      '<button onclick="listAlbums()">',
        'Back To Albums',
      '</button>',
    ]
    document.getElementById('app').innerHTML = getHtml(htmlTemplate);
  });
}

function addPhoto(albumName) {
  var files = document.getElementById('photoupload').files;
  if (!files.length) {
    return alert('Please choose a file to upload first.');
  }
  var file = files[0];
  var fileName = file.name;
  var albumPhotosKey = encodeURIComponent(albumName) + '//';

  var photoKey = albumPhotosKey + fileName;
  s3.upload({
    Key: photoKey,
    Body: file,
    ACL: 'public-read'
  }, function(err, data) {
    if (err) {
      return alert('There was an error uploading your photo: ', err.message);
    }
    alert('Successfully uploaded photo.');
    viewAlbum(albumName);
  });
}

function deletePhoto(albumName, photoKey) {
  s3.deleteObject({Key: photoKey}, function(err, data) {
    if (err) {
      return alert('There was an error deleting your photo: ', err.message);
    }
    alert('Successfully deleted photo.');
    viewAlbum(albumName);
  });
}

function deleteAlbum(albumName) {
  var albumKey = encodeURIComponent(albumName) + '/';
  s3.listObjects({Prefix: albumKey}, function(err, data) {
    if (err) {
      return alert('There was an error deleting your album: ', err.message);
    }
    var objects = data.Contents.map(function(object) {
      return {Key: object.Key};
    });
    s3.deleteObjects({
      Delete: {Objects: objects, Quiet: true}
    }, function(err, data) {
      if (err) {
        return alert('There was an error deleting your album: ', err.message);
      }
      alert('Successfully deleted album.');
      listAlbums();
    });
  });
}