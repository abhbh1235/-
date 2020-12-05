//기본모듈
var express = require('express')
  , http = require('http')
  , path = require('path');

//익스프레스 미들웨어
var bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , static = require('serve-static')
  , errorHandler = require('errorhandler');

//에러
var expressErrorHandler = require('express-error-handler');

//세션 미들웨어
var expressSession = require('express-session');

//몽구스 모듈
var mongoose = require('mongoose');


//익스프레스 객체 생성
var app = express();


//기본 속성 설정
app.set('port', precess.env.PORT || 80);

//
app.use(bodyParser.urlencoded({ extended: false}))

//
app.use(bodyParser.json())

//
app.use('/public', static(path.join(__dirname, 'public')));

//cookie-parsr 
app.use(cookieParser());

//세션 설정
app.use(expressSession({
    secret:'mykey',
    resave:true,
    saveUninitialized:true
}));

//데이터베이스 연결!!

//변수 선언
var database;
var UserSchema;
var UserModel;





//데이터베이스 연결
function connectDB(){
    //데이터베이스 연결 정보
    var databaseUrl = 'mongodb://localhost:27017/local'
}
//데이터 베이스 연결
    console.log('데이터베이스 연결을 시도합니다.');
    mongoose.Promise = global.Promise;
mongoose.connect(databaseUrl);
database=mongoose.connection;

database.on('error', consol.error.bind(console, 'mongoose connection error.'));
database.on('open', function(){
  console.log('데이터베이스에 연결되었습니다. : ' + databaseUrl);


  //스키마 정의
  UserSchema = mongoose.Schema({
    id: String,
    name: String,
    password: String
  });
  console.log('UserScema 정의함.');

  //UserModel 정의
  UserModel = mongoose.model("users",UserSchema);
  console.log('UserModel 정의함.');

});

//연결이 끊어졌을 떄 5초 후 재연결
database.on('disconnected', function(){
  console.log('연결이 끊어졌습니다. 5초 후 재연결합니다.');
  setInterval(connectDB,5000);
});




//라우팅 함수

//라우터 객체 참조
var router = express.Router();

//로그인 라우팅 함수-데이터 베이스의 정보와 비교
router.route('/process/login').post(function(req,res){
  console.log('process/login 호출됨.');

  //요청 피라미터 확인
  var paramId = req.body.id||req.query.id;
  var paramPassword = req.body.password||req.query.password;

  console.log('요청 파라미터 : '+paramId + ', ' + paramPassword);

  //데이터베이스 객체가 초기화된 경우, authUser 함수 호출하여 사용자 인증
  if(database){
    authUser(database,paramId,paramPassword, function(err, docs){
      if(err){throw err;}

      //조회된 레코드가 있으면 성공 응답 전송
      if(docs) {
        console.dir(docs);

        //조회된 결과에서 사용자 이름 확인
        var username= docs[0].name;

        res.writeHead('200',{'Content-Type':'text/HTML;charset=utf8'});
        res.write('<h1>로그인 성공</h1>');
        res.write('<div><p> 사용자 아이디 : ' + paramId + '</p></div>');
        res.write('<div><p> 사용자 이름 : ' + username + '</p></div>');
        res.write("<br><br><a href='/public/login.html'>다시 로그인하기</a>");
        res.end();

      } else{
        res.writeHead('200',{'Content-Type':'text/HTML;charset=utf8'});
        res.write('<h1>로그인 실패</h1>');
        res.write('<div><p>아이디와 패스워드를 다시 확인하십시오.</p></div>');
        res.write("<br><br><a href='/public/login.html'>다시 로그인하기</a>");
        res.end();
      }
    });
  } else {
    res.writeHead('200',{'Content-Type':'text/html;charset=utf8'});
    res.write('<h2>데이터베이스 연결 실패</h2>');
    res.write('<div><p>데이터베이스에 연결하지 못했습니다.</p></div>');
    res.end();
  }

});



//사용자 추가 라우팅 함수-클라이언트에서 보내요는 데이터를 이용해 데이터베이스에 추가
router.route('/process/adduser').post(function(req, res){
  console.log('/process/adduser 호출됨.');

  var paramId = req.body.id||req.query.id;
  var paramPassword = req.body.password||req.query.password;
  var paramName = req.body.name||req.query.name;

  console.log('요청 파라미터 : '+paramId + ', ' + paramPassword + ',' + paramName);

  //데이터베이스 객체가 초기화된 경우, addUser 함수 호출하여 사용자 추가
  if(database){
    addUser(database,paramId,paramPassword, paramName, function(err, addedUser){
      if(err){throw err;}

      //결과 객체가 있으면 성공
      if (addedUser) {
        console.dir(addedUser);

        res.writeHead('200',{'Content-Type':'text/HTML;charset=utf8'});
        res.write('<h2>사용자 추가 성공</h2>');
        res.end();
      } else {
        res.writeHead('200',{'Content-Type':'text/HTML;charset=utf8'});
        res.write('<h2>사용자 추가 실패</h2>');
        res.end();
      }
    });
  } else{
    res.writeHead('200',{'Content-Type':'text/HTML;charset=utf8'});
     res.write('<h2>데이터베이스 연결 실패</h2>');
     res.end();
  }

});


//라우터 객체 등록
app.use('/',router);



//사용자를 인증하는 함수
var authUser = function(database, id, password, callback){
  console.log('authUser 호출됨 : ' + id + ', ' + password);

  //아이디와 비밀번호를 이용해 검색
  UserModel.find({"id":id, "password":password}, function(err, results){
    if (err) {
      callback(err,null);
      return;
    }

    console.log('아이디 [%s], 패스워드 [%s]로 사용자 검색결과', id, password);
    console.dir(results);

    if(results.length>0){
      console.log('아이디 [%s], 패스워드 [%s]가 일치하는 사용자 찾음.',id, password);
      callback(null,results);
    }else{
      console.log("일치하는 사용자를 찾지 못함.");
      callback(null,null);
    }
  });
};


//사용자 추가 함수
var addUser =function(database, id, password, name, callback){
  console.log('addUser 호출됨 : '+id+', '+password+', ' + name);

  //UserModel 인스턴스 생성
  var user= new UserModel({"id":id, "password":password, "name":name});

  //save()로 저장 : 저장 성공 시 addedUser 객체가 파라미터로 전달됨
  user.save(function(err, addedUser){
    if (err) {
      callback(err,null);
      return;
    }

    console.log("사용자 데이터 추가함.");
    callback(null, addedUser);

  });
};


//404 에러 페이지 처리
var errorHandler = expressErrorHandler({
  static:{
    '404':'./public/404.html'
  }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);


//서버 시작

//프로세스 종료 시에 데이터베이스 연결 해제
Process.on('SIGTERM',function (){
  console.log("프로세스가 종료됩니다.");
  app.close();
});

app.on('close', function() {
  console.log("Express 서버 객체가 종료됩니다.");
  if(database){
    database.close();
  }
});

//Express 서버 시작
http.createServer(app).listen(app.get('port'), function(){
  console.log('서버가 시작되었습니다. 포트 : '+app.get('port'));

  //데이터베이스 연결을 위한 함수 호출
  connectDB();

});