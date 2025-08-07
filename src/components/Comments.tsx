
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Comments = ({ workflowId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [socket, setSocket] = useState(null);
  const { authFetch } = useAuth();

  useEffect(() => {
    const fetchComments = async () => {
      const response = await authFetch(`/api/v1/comments/?workflow_id=${workflowId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    };

    fetchComments();

    const ws = new WebSocket(`ws://localhost:8000/ws/comments/${workflowId}`);
    setSocket(ws);

    ws.onmessage = (event) => {
      const comment = JSON.parse(event.data);
      setComments((prevComments) => [...prevComments, comment]);
    };

    return () => {
      ws.close();
    };
  }, [workflowId, authFetch]);

  const handleAddComment = async () => {
    if (newComment.trim() === '') return;

    const response = await authFetch(`/api/v1/comments/?workflow_id=${workflowId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: newComment, workflow_node_id: 'general' }),
    });

    if (response.ok) {
      const comment = await response.json();
      // The comment will be added via the websocket connection
      setNewComment('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="text-sm">
                <span className="font-semibold">{comment.user.email}</span>: {comment.content}
              </div>
            ))}
          </div>
          <div className="flex space-x-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
            />
            <Button onClick={handleAddComment}>Send</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
