#include <bits/stdc++.h>
using namespace std;

class Node {
public:
    string name;
    bool isFile;
    int size;
    Node* parent;
    unordered_map<string, Node*> children;

    Node(string name, bool isFile=false, int size=0) {
        this->name = name;
        this->isFile = isFile;
        this->size = size;
        parent = nullptr;
    }
};

class FileSystem {
private:
    Node* root;
    Node* curr;

    stack<pair<Node*, Node*>> undoStack;
    stack<pair<Node*, Node*>> redoStack;

public:
    FileSystem() {
        root = new Node("/");
        curr = root;
    }

    // ---------- UTIL ----------
    vector<string> split(string path) {
        vector<string> res;
        string temp;
        stringstream ss(path);
        while (getline(ss, temp, '/')) {
            if (!temp.empty()) res.push_back(temp);
        }
        return res;
    }

    Node* traverse(string path) {
        Node* temp = (path[0] == '/') ? root : curr;
        vector<string> parts = split(path);

        for (string p : parts) {
            if (p == ".") continue;
            else if (p == "..") {
                if (temp->parent) temp = temp->parent;
            }
            else {
                if (!temp->children.count(p)) return nullptr;
                temp = temp->children[p];
            }
        }
        return temp;
    }

    Node* clone(Node* node) {
        Node* newNode = new Node(node->name, node->isFile, node->size);
        for (auto &c : node->children) {
            Node* childCopy = clone(c.second);
            childCopy->parent = newNode;
            newNode->children[c.first] = childCopy;
        }
        return newNode;
    }

    void deleteNode(Node* node) {
        for (auto &c : node->children) {
            deleteNode(c.second);
        }
        delete node;
    }

    // ---------- COMMANDS ----------
    void mkdir(string path) {
        Node* temp = (path[0] == '/') ? root : curr;
        vector<string> parts = split(path);

        for (string p : parts) {
            if (!temp->children.count(p)) {
                Node* newDir = new Node(p);
                newDir->parent = temp;
                temp->children[p] = newDir;
            }
            temp = temp->children[p];
        }
    }

    void touch(string name, int size) {
        if (curr->children.count(name)) return;

        Node* file = new Node(name, true, size);
        file->parent = curr;
        curr->children[name] = file;
    }

    void ls() {
        for (auto &p : curr->children) {
            cout << p.first;
            if (!p.second->isFile) cout << "/";
            cout << "  ";
        }
        cout << endl;
    }

    void cd(string path) {
        Node* dest = traverse(path);
        if (dest && !dest->isFile) curr = dest;
        else cout << "Invalid path\n";
    }

    string pwd() {
        Node* temp = curr;
        string path = "";

        while (temp != root) {
            path = "/" + temp->name + path;
            temp = temp->parent;
        }
        return (path.empty() ? "/" : path);
    }

    int du(Node* node) {
        if (node->isFile) return node->size;

        int total = 0;
        for (auto &c : node->children) {
            total += du(c.second);
        }
        return total;
    }

    void du_cmd() {
        cout << du(curr) << " bytes\n";
    }

    void find(Node* node, string target, string path) {
        string currPath = (node == root) ? "" : path + "/" + node->name;

        if (node->name == target)
            cout << (currPath.empty() ? "/" : currPath) << endl;

        for (auto &c : node->children) {
            find(c.second, target, currPath);
        }
    }

    void find_cmd(string name) {
        find(curr, name, "");
    }

    void rm(string name) {
        if (!curr->children.count(name)) return;

        Node* target = curr->children[name];

        undoStack.push({curr, clone(target)});
        while (!redoStack.empty()) redoStack.pop();

        deleteNode(target);
        curr->children.erase(name);
    }

    void undo() {
        if (undoStack.empty()) {
            cout << "Nothing to undo\n";
            return;
        }

        auto [parent, subtree] = undoStack.top();
        undoStack.pop();

        parent->children[subtree->name] = subtree;
        subtree->parent = parent;

        redoStack.push({parent, subtree});
    }

    void redo() {
        if (redoStack.empty()) {
            cout << "Nothing to redo\n";
            return;
        }

        auto [parent, subtree] = redoStack.top();
        redoStack.pop();

        parent->children.erase(subtree->name);

        undoStack.push({parent, clone(subtree)});
    }

    // ---------- SAVE / LOAD ----------
    void save(Node* node, ofstream &out, string path) {
        string full = (node == root) ? "" : path + "/" + node->name;

        if (node != root) {
            if (node->isFile)
                out << "F " << full << " " << node->size << "\n";
            else
                out << "D " << full << "\n";
        }

        for (auto &c : node->children)
            save(c.second, out, full);
    }

    void save_cmd(string filename) {
        ofstream out(filename);
        save(root, out, "");
        cout << "Saved.\n";
    }

void clear(Node* node) {
    for (auto &c : node->children)
        clear(c.second);
    delete node;
}

void load_cmd(string filename) {
    // 🔥 clear old system
    clear(root);

    root = new Node("/");
    curr = root;

    while (!undoStack.empty()) undoStack.pop();
    while (!redoStack.empty()) redoStack.pop();

    ifstream in(filename);
    string type, path;
    int size;

    while (in >> type >> path) {
        if (type == "D") {
            mkdir(path);
        } else {
            in >> size;

            vector<string> parts = split(path);
            string fname = parts.back();
            parts.pop_back();

            Node* dir = root;
            for (string p : parts) {
                if (!dir->children.count(p)) {
                    Node* newDir = new Node(p);
                    newDir->parent = dir;
                    dir->children[p] = newDir;
                }
                dir = dir->children[p];
            }

            Node* file = new Node(fname, true, size);
            file->parent = dir;
            dir->children[fname] = file;
        }
    }

    cout << "Loaded (fresh state).\n";
}

};

// ---------- MAIN ----------
int main() {
    FileSystem fs;
    string cmd;

    while (true) {
        cout << fs.pwd() << " $ ";
        cin >> cmd;

        if (cmd == "mkdir") {
            string path; cin >> path;
            fs.mkdir(path);
        }
        else if (cmd == "touch") {
            string name; int size;
            cin >> name >> size;
            fs.touch(name, size);
        }
        else if (cmd == "ls") fs.ls();
        else if (cmd == "cd") {
            string path; cin >> path;
            fs.cd(path);
        }
        else if (cmd == "pwd") cout << fs.pwd() << endl;
        else if (cmd == "du") fs.du_cmd();
        else if (cmd == "find") {
            string name; cin >> name;
            fs.find_cmd(name);
        }
        else if (cmd == "rm") {
            string name; cin >> name;
            fs.rm(name);
        }
        else if (cmd == "undo") fs.undo();
        else if (cmd == "redo") fs.redo();
        else if (cmd == "save") {
            string f; cin >> f;
            fs.save_cmd(f);
        }
        else if (cmd == "load") {
            string f; cin >> f;
            fs.load_cmd(f);
        }
        else if (cmd == "exit") break;
    }
}