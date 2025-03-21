import React, { useEffect, useState } from "react";
import axios from "axios";

interface User {
  id: number;
  username: string;
  email: string;
  registrationDate: string;
  firstName: string;
  lastName: string;
  bio: {
    id: number;
    profilePictureUrl: string;
    location: string;
    interests: string;
    dateOfBirth: string;
    privateProfile: boolean;
    instagramProfileUrl: string;
    preferredLanguage: string;
  };
  role: {
    id: number;
    name: string;
  };
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/users");
      setUsers(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  return (
    <div>
      <h2>User List</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Registration Date</th>
            <th>Location</th>
            <th>Interests</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.registrationDate}</td>
              <td>{user.bio.location}</td>
              <td>{user.bio.interests}</td>
              <td>{user.firstName}</td>
              <td>{user.bio.dateOfBirth}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
