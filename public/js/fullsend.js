const getGroups = async () => {
  const isLoggedIn = (await checkLogin()).data[0].user_id;
  if (isLoggedIn) {
    const groups = (await (await fetch("/api/groups")).json()).data;
  }
};

const getContactNumbersInGroup = async (group) => {
  let numbers = [];
  const contacts = (await (await fetch(`/api/group/${group}/contacts`)).json())
    .data;
  for (contact of contacts) {
    numbers.push(contact.phone_number);
  }
  console.log(numbers);
};
