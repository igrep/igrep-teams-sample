const users = {};
module.exports = {
  addUser(user){
    users[user.profile.oid] = user;
  },
  addProfileAndToken(profile, oauthToken){
    users[profile.oid] = { profile, oauthToken };
  },
  lookup(id){
    return users[id];
  },
  dump(){
    console.info(`users.dump: ${JSON.stringify(users)}\n`);
  }
};
